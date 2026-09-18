from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.preprocessing import LabelEncoder

app = FastAPI()


# Load trained model
with open("accident_model.pkl", "rb") as f:
    model = pickle.load(f)


# Load original accident data
df = pd.read_csv("accidents_clean_en.csv")
df["date"] = pd.to_datetime(df["date"])
df["district"] = df["district"].astype(str)

wcols = ["weather_code", "temp_max", "temp_min", "temp_mean", "windgusts_max", "humidity_mean"]
districts = sorted(df["district"].unique())
feats = ["year_d", "month_d", "day_d", "dow_enc", "district_enc", "district_total",
         "lag7", "lag10", "lag14", "lag21", "lag28", "lag30", "l1",
         "deaths7_prev", "deaths_lag7", "load364", "roll90", "roll180", "roll365",
         "dow_avg", "month_avg", "sindoy", "cosdoy"] + wcols

# Daily accident/death counts per (date, district) for history features
days = pd.date_range(df["date"].min(), df["date"].max(), freq="D")
daily = pd.DataFrame([(d, dist) for d in days for dist in districts],
                     columns=["date", "district"])
counts = df.groupby(["date", "district"]).size().reset_index(name="n")
deaths = df.groupby(["date", "district"])["deaths_count"].sum().reset_index(name="deaths")
daily = daily.merge(counts, on=["date", "district"], how="left").merge(deaths, on=["date", "district"], how="left")
daily["n"] = daily["n"].fillna(0)
daily["deaths"] = daily["deaths"].fillna(0)

# Static district size (baseline demand)
dtot = df.groupby("district").size().astype(float)

le_day = LabelEncoder()
le_day.fit(df["day_of_week"].astype(str))
le_district = LabelEncoder()
le_district.fit(df["district"])


def predict_accident_count(date_str):
    """Accidents per district for the next 7 days from the given date."""
    d = pd.to_datetime(date_str)
    hist = daily[daily["date"] < d]
    clim = df.assign(m=df["date"].dt.month).groupby(["district", "m"])[wcols].mean()
    dclim_series = df.groupby("district")[wcols].mean()
    wd = d.weekday()
    doy = d.dayofyear
    rows = []

    for dist in districts:
        h = hist[(hist["district"] == dist) & (hist["date"] < d)]["n"].reset_index(drop=True)
        dh = hist[(hist["district"] == dist) & (hist["date"] < d)]["deaths"].reset_index(drop=True)
        hw = hist[(hist["district"] == dist) & (hist["date"] < d) & (hist["date"].dt.weekday == wd)]["n"].reset_index(drop=True)
        hm = hist[(hist["district"] == dist) & (hist["date"] < d) & (hist["date"].dt.month == d.month)]["n"].reset_index(drop=True)

        if len(h) == 0:
            l1 = lag7 = lag10 = lag14 = lag21 = lag28 = lag30 = 0.0
            roll90 = roll180 = roll365 = load364 = deaths7 = deaths_lag7 = 0.0
        else:
            l1 = float(h.iloc[-1])                       # yesterday (d-1)
            lag7 = float(h.iloc[-14:-7].sum())           # [d-14, d-8]
            lag10 = float(h.iloc[-17:-10].sum())         # [d-17, d-11]
            lag14 = float(h.iloc[-21:-14].sum())         # [d-21, d-15]
            lag21 = float(h.iloc[-28:-21].sum())         # [d-28, d-22]
            lag28 = float(h.iloc[-35:-28].sum())         # [d-35, d-29]
            lag30 = float(h.tail(30).sum())              # [d-30, d-1]
            roll90 = float(h.tail(90).sum())             # [d-90, d-1]
            roll180 = float(h.tail(180).sum())           # [d-180, d-1]
            roll365 = float(h.tail(365).sum())           # [d-365, d-1]
            load364 = float(h.iloc[-371:-364].sum())     # [d-371, d-365]
            deaths7 = float(dh.tail(7).sum())            # deaths [d-7, d-1]
            deaths_lag7 = float(dh.iloc[-14:-7].sum())   # deaths [d-14, d-8]

        row = {"year_d": d.year, "month_d": d.month, "day_d": d.day,
               "dow_enc": le_day.transform([d.day_name()])[0],
               "district_enc": le_district.transform([dist])[0],
               "district_total": dtot[dist],
               "lag7": lag7, "lag10": lag10, "lag14": lag14, "lag21": lag21,
               "lag28": lag28, "lag30": lag30, "l1": l1,
               "deaths7_prev": deaths7, "deaths_lag7": deaths_lag7,
               "load364": load364, "roll90": roll90, "roll180": roll180,
               "roll365": roll365,
               "dow_avg": float(hw.tail(4).mean()) if len(hw) > 0 else 0.0,
               "month_avg": float(hm.mean()) if len(hm) > 0 else 0.0,
               "sindoy": np.sin(2 * np.pi * doy / 365.25),
               "cosdoy": np.cos(2 * np.pi * doy / 365.25)}
        w = clim.loc[(dist, d.month)] if (dist, d.month) in clim.index else dclim_series.loc[dist]
        for c in wcols:
            row[c] = float(w[c])
        rows.append(row)

    X_pred = pd.DataFrame(rows)
    preds = np.maximum(model.predict(X_pred[feats]), 0)
    preds = np.ceil(preds).astype(int)
    return dict(zip(districts, preds.tolist()))


class PredictionRequest(BaseModel):
    date: str


@app.get("/")
def root():
    return {
        "message": "Sri Lanka Accident Prediction API is running"
    }


@app.post("/predict")
def predict(request: PredictionRequest):

    result = predict_accident_count(
        request.date
    )

    return {
        "date": request.date,
        "predictions": result
    }
import { ML_API_BASE_URL } from '@/lib/api';

import type { DistrictPrediction, RiskLevel } from '@/types';

type PredictionDTO = {
  date: string;
  predictions: Record<string, number>;
};

function riskForCount(count: number): RiskLevel {
  if (count >= 3) return 'High';
  if (count === 2) return 'Medium';
  return 'Low';
}

export class PredictionService {
  async getForDate(date: string): Promise<DistrictPrediction[]> {
    const res = await fetch(`${ML_API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });

    if (!res.ok) {
      throw new Error('Failed to load accident predictions');
    }

    const dto: PredictionDTO = await res.json();

    return Object.entries(dto.predictions).map(([name, count]) => ({
      name,
      count,
      risk: riskForCount(count),
    }));
  }
}
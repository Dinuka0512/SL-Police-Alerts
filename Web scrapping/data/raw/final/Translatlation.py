import csv

# ============================================
# CONFIG
# ============================================
INPUT_CSV = "accidents_clean.csv"
OUTPUT_CSV = "accidents_clean_en.csv"

# ============================================
# ⭐ ශ්‍රී ලංකා නගර → (English City, English District, Lat, Lon)
# ============================================
TRANSLATIONS = {
    # ============ Colombo ============
    "කොළඹ": ("Colombo", "Colombo", 6.9271, 79.8612),
    "දෙහිවල": ("Dehiwala", "Colombo", 6.8511, 79.8636),
    "මොරටුව": ("Moratuwa", "Colombo", 6.7730, 79.8816),
    "මවුන්ට් ලැවිනියා": ("Mount Lavinia", "Colombo", 6.8389, 79.8636),
    "රත්මලාන": ("Ratmalana", "Colombo", 6.8181, 79.8867),
    "නුගේගොඩ": ("Nugegoda", "Colombo", 6.8649, 79.8997),
    "කොට්ටාව": ("Kottawa", "Colombo", 6.8412, 79.9653),
    "පිළියන්දල": ("Piliyandala", "Colombo", 6.8011, 79.9231),
    "බොරලැස්ගමුව": ("Boralesgamuwa", "Colombo", 6.8394, 79.9024),
    "කැස්බෑව": ("Kesbewa", "Colombo", 6.7959, 79.9383),
    "හෝමාගම": ("Homagama", "Colombo", 6.8408, 80.0024),
    "මහරගම": ("Maharagama", "Colombo", 6.8480, 79.9265),
    "පන්නිපිටිය": ("Pannipitiya", "Colombo", 6.8463, 79.9418),
    "බත්තරමුල්ල": ("Battaramulla", "Colombo", 6.8989, 79.9181),
    "කඩවත": ("Kadawatha", "Colombo", 7.0000, 79.9500),
    "මුල්ලේරියාව": ("Mulleriyawa", "Colombo", 6.9333, 79.9333),
    "වත්තල": ("Wattala", "Colombo", 6.9897, 79.8919),
    "ජා-ඇල": ("Ja-Ela", "Colombo", 7.0744, 79.8919),
    "ජාඇල": ("Ja-Ela", "Colombo", 7.0744, 79.8919),
    "කෙළනිය": ("Kelaniya", "Colombo", 6.9553, 79.9219),
    "සීදුව": ("Seeduwa", "Colombo", 7.1258, 79.8831),
    "මීගොඩ": ("Meegoda", "Colombo", 6.8434, 80.0093),

    # ============ Gampaha ============
    "ගම්පහ": ("Gampaha", "Gampaha", 7.0917, 79.9997),
    "නිට්ටඹුව": ("Nittambuwa", "Gampaha", 7.1417, 80.0944),
    "මීගමුව": ("Negombo", "Gampaha", 7.2083, 79.8358),
    "වේයන්ගොඩ": ("Veyangoda", "Gampaha", 7.1542, 80.0583),
    "මිනුවන්ගොඩ": ("Minuwangoda", "Gampaha", 7.1667, 79.9500),
    "දිවුලපිටිය": ("Divulapitiya", "Gampaha", 7.2219, 79.9581),
    "මීරිගම": ("Mirigama", "Gampaha", 7.2417, 80.1236),
    "අත්තනගල්ල": ("Attanagalla", "Gampaha", 7.1125, 80.0056),
    "රාගම": ("Ragama", "Gampaha", 7.0286, 79.9197),
    "කටුනායක": ("Katunayake", "Gampaha", 7.1697, 79.8844),
    "දොම්පේ": ("Dompe", "Gampaha", 7.0167, 80.0500),
    "පෑලියගොඩ": ("Peliyagoda", "Gampaha", 6.9556, 79.8864),
    "කැළණිය": ("Kelaniya", "Gampaha", 6.9553, 79.9219),
    "බියගම": ("Biyagama", "Gampaha", 6.9500, 79.9833),
    "හෙන්දල": ("Hendala", "Gampaha", 6.9833, 79.8833),

    # ============ Kalutara ============
    "කළුතර": ("Kalutara", "Kalutara", 6.5854, 79.9607),
    "පානදුර": ("Panadura", "Kalutara", 6.7133, 79.9025),
    "හොරණ": ("Horana", "Kalutara", 6.7156, 80.0644),
    "බණ්ඩාරගම": ("Bandaragama", "Kalutara", 6.7139, 79.9889),
    "බේරුවල": ("Beruwala", "Kalutara", 6.4789, 79.9828),
    "අලුත්ගම": ("Aluthgama", "Kalutara", 6.4333, 79.9958),
    "මතුගම": ("Matugama", "Kalutara", 6.5219, 80.1164),
    "ඉංගිරිය": ("Ingiriya", "Kalutara", 6.7428, 80.1647),
    "දොඩංගොඩ": ("Dodangoda", "Kalutara", 6.5500, 80.0167),
    "වාද්දුව": ("Wadduwa", "Kalutara", 6.6667, 79.9250),
    "පයාගල": ("Payagala", "Kalutara", 6.5167, 79.9833),
    "මිල්ලනිය": ("Millaniya", "Kalutara", 6.6833, 80.0333),

    # ============ Kandy ============
    "මහනුවර": ("Kandy", "Kandy", 7.2906, 80.6337),
    "ගම්පොල": ("Gampola", "Kandy", 7.1647, 80.5767),
    "කටුගස්තොට": ("Katugastota", "Kandy", 7.3167, 80.6167),
    "පේරාදෙණිය": ("Peradeniya", "Kandy", 7.2600, 80.6000),
    "දිගන": ("Digana", "Kandy", 7.2833, 80.7500),
    "කුණ්ඩසාලේ": ("Kundasale", "Kandy", 7.2833, 80.7000),
    "පිළිමතලාව": ("Pilimathalawa", "Kandy", 7.2167, 80.5667),
    "ගලගෙදර": ("Galagedara", "Kandy", 7.3667, 80.5333),
    "කදුගන්නාව": ("Kadugannawa", "Kandy", 7.2500, 80.5167),

    # ============ Matale ============
    "මාතලේ": ("Matale", "Matale", 7.4675, 80.6234),
    "දඹුල්ල": ("Dambulla", "Matale", 7.8675, 80.6522),
    "සීගිරිය": ("Sigiriya", "Matale", 7.9575, 80.7603),
    "රත්තොට": ("Rattota", "Matale", 7.5333, 80.7000),
    "ගලේවෙල": ("Galewela", "Matale", 7.7500, 80.5667),
    "නාඋල": ("Naula", "Matale", 7.7000, 80.6500),
    "විල්ගමුව": ("Wilgamuwa", "Matale", 7.5667, 80.8333),
    "පල්ලේපොල": ("Pallepola", "Matale", 7.5833, 80.6000),
    "උකුවෙල": ("Ukuwela", "Matale", 7.4667, 80.6500),
    "ලග්ගල": ("Laggala", "Matale", 7.5667, 80.8000),
    "හසලක": ("Hasalaka", "Matale", 7.3500, 80.8833),

    # ============ Nuwara Eliya ============
    "නුවරඑළිය": ("Nuwara Eliya", "Nuwara Eliya", 6.9497, 80.7891),
    "හැටන්": ("Hatton", "Nuwara Eliya", 6.8917, 80.5958),
    "තලවකැලේ": ("Talawakele", "Nuwara Eliya", 6.9333, 80.6500),
    "ගිනිගත්හේන": ("Ginigathhena", "Nuwara Eliya", 6.9833, 80.4667),
    "රාගල": ("Ragala", "Nuwara Eliya", 6.9167, 80.8000),
    "අඹේවෙල": ("Ambewela", "Nuwara Eliya", 6.8667, 80.8167),
    "කොටගල": ("Kotagala", "Nuwara Eliya", 6.9500, 80.5833),
    "දිඹුල": ("Dimbula", "Nuwara Eliya", 6.9333, 80.6000),
    "නෝර්වුඩ්": ("Norwood", "Nuwara Eliya", 6.8500, 80.6167),
    "මස්කෙලිය": ("Maskeliya", "Nuwara Eliya", 6.8333, 80.5667),
    "බෝගවන්තලාව": ("Bogawantalawa", "Nuwara Eliya", 6.8000, 80.6667),

    # ============ Badulla ============
    "බදුල්ල": ("Badulla", "Badulla", 6.9934, 81.0550),
    "බණ්ඩාරවෙල": ("Bandarawela", "Badulla", 6.8325, 80.9886),
    "හාලිඇල": ("Hali Ela", "Badulla", 6.9667, 81.0167),
    "පස්සර": ("Passara", "Badulla", 6.9333, 81.1500),
    "වැලිමඩ": ("Welimada", "Badulla", 6.9000, 80.9000),
    "මහියංගනය": ("Mahiyanganaya", "Badulla", 7.3333, 81.0000),
    "දියතලාව": ("Diyatalawa", "Badulla", 6.8167, 80.9667),
    "හපුතලේ": ("Haputale", "Badulla", 6.7667, 80.9500),
    "එල්ල": ("Ella", "Badulla", 6.8667, 81.0500),
    "කන්දෙකෙටිය": ("Kandeketiya", "Badulla", 7.0500, 81.1000),
    "මීගහකිවුල": ("Meegahakiwula", "Badulla", 7.0667, 81.0500),
    "රිදීමාලියද්ද": ("Ridimaliyadda", "Badulla", 7.1667, 81.1500),

    # ============ Monaragala ============
    "මොණරාගල": ("Monaragala", "Monaragala", 6.8728, 81.3505),
    "වැල්ලවාය": ("Wellawaya", "Monaragala", 6.7333, 81.1000),
    "බිබිල": ("Bibila", "Monaragala", 6.7667, 81.2167),
    "බුත්තල": ("Buttala", "Monaragala", 6.7500, 81.2333),
    "කතරගම": ("Kataragama", "Monaragala", 6.4167, 81.3333),
    "සියඹලාණ්ඩුව": ("Siyambalanduwa", "Monaragala", 6.9000, 81.5333),
    "මැදගම": ("Medagama", "Monaragala", 6.7500, 81.1500),
    "තණමල්විල": ("Thanamalwila", "Monaragala", 6.4333, 81.0333),

    # ============ Ampara ============
    "අම්පාර": ("Ampara", "Ampara", 7.2975, 81.6820),
    "කල්මුණේ": ("Kalmunai", "Ampara", 7.4167, 81.8333),
    "සමන්තුරේ": ("Samanthurai", "Ampara", 7.3667, 81.8167),
    "පොතුවිල්": ("Pottuvil", "Ampara", 6.8667, 81.8333),
    "මහඔය": ("Maha Oya", "Ampara", 7.5000, 81.3833),
    "දමන": ("Damana", "Ampara", 7.3000, 81.7000),
    "අක්කරෙයිපත්තු": ("Akkaraipattu", "Ampara", 7.2167, 81.8500),
    "තිරුක්කෝවිල්": ("Thirukkovil", "Ampara", 6.8333, 81.8000),

    # ============ Batticaloa ============
    "මඩකලපුව": ("Batticaloa", "Batticaloa", 7.7102, 81.6924),
    "කාත්තාන්කුඩි": ("Kattankudy", "Batticaloa", 7.6833, 81.7333),
    "එරාවුර්": ("Eravur", "Batticaloa", 7.7667, 81.6000),
    "වාලච්චේන": ("Valaichchenai", "Batticaloa", 7.9167, 81.5333),
    "චෙන්කලඩි": ("Chenkalady", "Batticaloa", 7.7833, 81.6000),

    # ============ Trincomalee ============
    "ත්‍රිකුණාමලය": ("Trincomalee", "Trincomalee", 8.5874, 81.2152),
    "කින්නියා": ("Kinniya", "Trincomalee", 8.5000, 81.1833),
    "මුතූර්": ("Muttur", "Trincomalee", 8.4500, 81.2667),
    "නිලාවේලි": ("Nilaveli", "Trincomalee", 8.6833, 81.1833),
    "කන්තලේ": ("Kantale", "Trincomalee", 8.3500, 81.0000),
    "සේරුවිල": ("Seruwila", "Trincomalee", 8.5000, 81.3000),

    # ============ Jaffna ============
    "යාපනය": ("Jaffna", "Jaffna", 9.6615, 80.0255),
    "චාවකච්චේරි": ("Chavakachcheri", "Jaffna", 9.6500, 80.1667),
    "පේදුරුතුඩුව": ("Point Pedro", "Jaffna", 9.8167, 80.2333),
    "කෝපායි": ("Kopay", "Jaffna", 9.7000, 80.0333),
    "නෙල්ලියඩි": ("Nelliady", "Jaffna", 9.7833, 80.0833),
    "පරන්තන්": ("Paranthan", "Jaffna", 9.4333, 80.4167),
    "වඩමරච්චි": ("Vadamarachchi", "Jaffna", 9.7500, 80.2000),
    "කයිට්ස්": ("Kayts", "Jaffna", 9.7000, 79.8500),
    "ඩෙල්ෆ්": ("Delft", "Jaffna", 9.5000, 79.6833),

    # ============ Kilinochchi ============
    "කිලිනොච්චිය": ("Kilinochchi", "Kilinochchi", 9.3961, 80.3981),
    "පලෙයි": ("Pallai", "Kilinochchi", 9.4667, 80.4167),
    "අයියකච්චිය": ("Ariyalkulam", "Kilinochchi", 9.3667, 80.4000),

    # ============ Mannar ============
    "මන්නාරම": ("Mannar", "Mannar", 8.9779, 79.9120),
    "මුරුන්කන්": ("Murunkan", "Mannar", 8.8333, 80.0500),
    "පල්ලිමුනෙයි": ("Pallimunai", "Mannar", 8.9500, 79.8833),
    "නානාට්ටාන්": ("Nanattan", "Mannar", 8.9833, 79.9667),

    # ============ Mullaitivu ============
    "මුලතිව්": ("Mullaitivu", "Mullaitivu", 9.2670, 80.8144),
    "ඔඩ්ඩුසුඩාන්": ("Oddusuddan", "Mullaitivu", 9.1500, 80.6333),
    "පුදුකුඩිඉරිප්පු": ("Pudukudiyiruppu", "Mullaitivu", 9.2333, 80.7500),
    "මල්ලාවි": ("Mallavi", "Mullaitivu", 9.1167, 80.2333),
    "වෙල්ලන්කුලම": ("Vellankulam", "Mullaitivu", 9.2667, 80.3167),

    # ============ Vavuniya ============
    "වවුනියාව": ("Vavuniya", "Vavuniya", 8.7514, 80.4971),
    "ඕමන්තේ": ("Omanthei", "Vavuniya", 8.8333, 80.5000),
    "පුලියන්කුලම": ("Puliyankulam", "Vavuniya", 8.8833, 80.4667),
    "චෙට්ටිකුලම": ("Chettikulam", "Vavuniya", 8.8000, 80.4500),
    "නෙදුන්කර්නි": ("Nedunkeni", "Vavuniya", 8.9167, 80.4667),

    # ============ Anuradhapura ============
    "අනුරාධපුර": ("Anuradhapura", "Anuradhapura", 8.3114, 80.4037),
    "මිහින්තලේ": ("Mihintale", "Anuradhapura", 8.3500, 80.5167),
    "කැකිරාව": ("Kekirawa", "Anuradhapura", 8.0333, 80.6000),
    "මැදවච්චිය": ("Medawachchiya", "Anuradhapura", 8.5333, 80.5000),
    "ගල්නෑව": ("Galnewa", "Anuradhapura", 8.1500, 80.4000),
    "තඹුත්තේගම": ("Thambuttegama", "Anuradhapura", 8.1500, 80.3167),
    "හොරොව්පතාන": ("Horowpothana", "Anuradhapura", 8.5500, 80.8333),
    "ගලේන්බිඳුණුවැව": ("Galenbindunuwewa", "Anuradhapura", 8.2833, 80.6167),
    "පදවිය": ("Padaviya", "Anuradhapura", 8.8000, 80.7667),
    "කහටගස්දිගිලිය": ("Kahatagasdigiliya", "Anuradhapura", 8.4667, 80.5833),
    "රාජාංගණය": ("Rajanganaya", "Anuradhapura", 8.1500, 80.2167),
    "පලුගස්වැව": ("Palugaswewa", "Anuradhapura", 8.5000, 80.7833),

    # ============ Polonnaruwa ============
    "පොළොන්නරුව": ("Polonnaruwa", "Polonnaruwa", 7.9403, 81.0188),
    "හිඟුරක්ගොඩ": ("Hingurakgoda", "Polonnaruwa", 8.0500, 80.9500),
    "මැදිරිගිරිය": ("Medirigiriya", "Polonnaruwa", 8.1500, 80.9667),
    "වැලිකන්ද": ("Welikanda", "Polonnaruwa", 7.8833, 81.1000),
    "අරලගංවිල": ("Aralaganwila", "Polonnaruwa", 7.8500, 81.1000),
    "දිඹුලාගල": ("Dimbulagala", "Polonnaruwa", 7.9667, 81.0000),

    # ============ Puttalam ============
    "පුත්තලම": ("Puttalam", "Puttalam", 8.0362, 79.8283),
    "චිලාව": ("Chilaw", "Puttalam", 7.5758, 79.7953),
    "ආනමඩුව": ("Anamaduwa", "Puttalam", 7.8667, 79.9833),
    "කල්පිටිය": ("Kalpitiya", "Puttalam", 8.2333, 79.7667),
    "වෙන්නප්පුව": ("Wennappuwa", "Puttalam", 7.3500, 79.8333),
    "හලාවත": ("Chilaw", "Puttalam", 7.5758, 79.7953),
    "මාදම්පේ": ("Madampe", "Puttalam", 7.5000, 79.8167),
    "මුන්දලම": ("Mundalama", "Puttalam", 8.1167, 79.8333),
    "නොරොච්චෝලේ": ("Norochcholai", "Puttalam", 8.1000, 79.7333),
    "කරුවලගස්වැව": ("Karuwalagaswewa", "Puttalam", 8.1500, 79.9500),
    "දංකොටුව": ("Dankotuwa", "Puttalam", 7.2833, 79.9000),

    # ============ Kurunegala ============
    "කුරුණෑගල": ("Kurunegala", "Kurunegala", 7.4863, 80.3647),
    "කුලියාපිටිය": ("Kuliyapitiya", "Kurunegala", 7.4708, 80.0400),
    "නාරම්මල": ("Narammala", "Kurunegala", 7.4167, 80.0167),
    "පොල්ගහවෙල": ("Polgahawela", "Kurunegala", 7.3333, 80.3000),
    "මාවතගම": ("Mawathagama", "Kurunegala", 7.4167, 80.4500),
    "වාරියපොල": ("Wariyapola", "Kurunegala", 7.6333, 80.2333),
    "අලව්ව": ("Alawwa", "Kurunegala", 7.3000, 80.2333),
    "මහව": ("Mahawa", "Kurunegala", 7.8000, 80.3167),
    "දඹදෙණිය": ("Dambadeniya", "Kurunegala", 7.3667, 80.1333),
    "මල්සිරිපුර": ("Melsiripura", "Kurunegala", 7.6167, 80.5000),
    "පන්නල": ("Pannala", "Kurunegala", 7.3167, 79.9333),
    "ගල්ගමුව": ("Galgamuwa", "Kurunegala", 8.0167, 80.2833),
    "ගිරිඋල්ල": ("Giriulla", "Kurunegala", 7.3333, 80.1333),
    "රිදීගම": ("Ridigama", "Kurunegala", 7.5000, 80.4667),
    "ඉබ්බාගමුව": ("Ibbagamuwa", "Kurunegala", 7.5000, 80.4000),
    "බමුණකොටුව": ("Bamunakotuwa", "Kurunegala", 7.5000, 80.2833),

    # ============ Kegalle ============
    "කෑගල්ල": ("Kegalle", "Kegalle", 7.2513, 80.3464),
    "මාවනැල්ල": ("Mawanella", "Kegalle", 7.2500, 80.4500),
    "රඹුක්කන": ("Rambukkana", "Kegalle", 7.3167, 80.4000),
    "වරකාපොල": ("Warakapola", "Kegalle", 7.2167, 80.2000),
    "රුවන්වැල්ල": ("Ruwanwella", "Kegalle", 7.0500, 80.2500),
    "දෙහිඕවිට": ("Dehiowita", "Kegalle", 6.9833, 80.2500),
    "කිතුල්ගල": ("Kitulgala", "Kegalle", 6.9833, 80.4167),
    "මොලගොඩ": ("Molagoda", "Kegalle", 7.2167, 80.4000),
    "අරණායක": ("Aranayaka", "Kegalle", 7.1500, 80.4333),
    "හේම්මාතගම": ("Hemmathagama", "Kegalle", 7.2000, 80.5000),

    # ============ Ratnapura ============
    "රත්නපුර": ("Ratnapura", "Ratnapura", 6.6828, 80.3992),
    "ඇඹිලිපිටිය": ("Embilipitiya", "Ratnapura", 6.3417, 80.8500),
    "බලංගොඩ": ("Balangoda", "Ratnapura", 6.6500, 80.7000),
    "කුරුවිට": ("Kuruwita", "Ratnapura", 6.7833, 80.3667),
    "පැල්මඩුල්ල": ("Pelmadulla", "Ratnapura", 6.6167, 80.5500),
    "කහවත්ත": ("Kahawatta", "Ratnapura", 6.6000, 80.5333),
    "ගොඩකවෙල": ("Godakawela", "Ratnapura", 6.5000, 80.5500),
    "නිවිතිගල": ("Nivithigala", "Ratnapura", 6.6167, 80.4667),
    "කලවාන": ("Kalawana", "Ratnapura", 6.5167, 80.4000),
    "අයගම": ("Ayagama", "Ratnapura", 6.6167, 80.3167),
    "කිරිඇල්ල": ("Kiriella", "Ratnapura", 6.7500, 80.3667),

    # ============ Galle ============
    "ගාල්ල": ("Galle", "Galle", 6.0535, 80.2210),
    "අම්බලන්ගොඩ": ("Ambalangoda", "Galle", 6.2354, 80.0538),
    "අම්බලංගොඩ": ("Ambalangoda", "Galle", 6.2354, 80.0538),
    "හික්කඩුව": ("Hikkaduwa", "Galle", 6.1400, 80.1000),
    "බද්දේගම": ("Baddegama", "Galle", 6.1667, 80.1833),
    "එල්පිටිය": ("Elpitiya", "Galle", 6.2833, 80.1667),
    "උඩුගම": ("Udugama", "Galle", 6.2833, 80.3667),
    "කරාපිටිය": ("Karapitiya", "Galle", 6.0667, 80.2167),
    "වක්වැල්ල": ("Wakwella", "Galle", 6.1000, 80.1667),
    "බෙන්තොට": ("Bentota", "Galle", 6.4167, 79.9958),
    "බටපොල": ("Batapola", "Galle", 6.2000, 80.1167),
    "නෙළුව": ("Neluwa", "Galle", 6.3500, 80.3833),
    "නාගොඩ": ("Nagoda", "Galle", 6.1333, 80.1833),
    "යක්කලමුල්ල": ("Yakkalamulla", "Galle", 6.1167, 80.2500),

    # ============ Matara ============
    "මාතර": ("Matara", "Matara", 5.9485, 80.5353),
    "වැලිගම": ("Weligama", "Matara", 5.9750, 80.4297),
    "අකුරැස්ස": ("Akuressa", "Matara", 6.1000, 80.4833),
    "දෙනියාය": ("Deniyaya", "Matara", 6.3417, 80.5500),
    "කඹුරුපිටිය": ("Kamburupitiya", "Matara", 6.0833, 80.5667),
    "දික්වැල්ල": ("Dickwella", "Matara", 5.9667, 80.6833),
    "හක්මන": ("Hakmana", "Matara", 6.0667, 80.6167),
    "මාලිම්බඩ": ("Malimbada", "Matara", 6.0167, 80.5167),
    "පාල්මුල්ල": ("Palmulla", "Matara", 6.1167, 80.5500),

    # ============ Hambantota ============
    "හම්බන්තොට": ("Hambantota", "Hambantota", 6.1246, 81.1185),
    "තංගල්ල": ("Tangalle", "Hambantota", 6.0242, 80.7944),
    "තිස්සමහාරාම": ("Tissamaharama", "Hambantota", 6.2833, 81.2833),
    "අම්බලන්තොට": ("Ambalantota", "Hambantota", 6.1167, 81.0167),
    "වැලිගත්ත": ("Waligatta", "Hambantota", 6.2000, 81.0333),
    "සූරියවැව": ("Sooriyawewa", "Hambantota", 6.3167, 81.0000),
    "ලුණුගම්වෙහෙර": ("Lunugamvehera", "Hambantota", 6.3167, 81.2167),
    "ඕකන්ද": ("Okanda", "Hambantota", 6.6500, 81.7167),
    "මීල්ලව": ("Meellawa", "Hambantota", 6.1833, 81.0500),
    "අන්ගුනුකොලපැලැස්ස": ("Angunakolapelessa", "Hambantota", 6.1833, 80.9167),
}


# ============================================
# HELPERS
# ============================================
def is_empty(value):
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


# ============================================
# MAIN
# ============================================
def main():
    print("🔤 Translating Sinhala → English + Real Coords...\n")

    rows = []
    translated = 0
    coords_updated = 0
    not_found = []
    not_found_counter = {}

    with open(INPUT_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        print(f"📄 Columns: {len(headers)}\n")

        for row in reader:
            city_sinhala = (row.get("city") or "").strip()

            if city_sinhala in TRANSLATIONS:
                english_city, english_district, lat, lon = TRANSLATIONS[city_sinhala]

                # Update city + district
                row["city"] = english_city
                row["district"] = english_district

                # ⭐ Update lat/lon with REAL values
                old_lat = (row.get("latitude") or "").strip()
                old_lon = (row.get("longitude") or "").strip()

                row["latitude"] = lat
                row["longitude"] = lon

                if str(lat) != old_lat or str(lon) != old_lon:
                    coords_updated += 1

                translated += 1
            else:
                if city_sinhala:
                    not_found.append(city_sinhala)
                    not_found_counter[city_sinhala] = (
                        not_found_counter.get(city_sinhala, 0) + 1
                    )

            rows.append(row)

    # Write
    with open(OUTPUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

    # Report
    print(f"{'='*60}")
    print(f"✅ DONE")
    print(f"   Total rows:       {len(rows)}")
    print(f"   Translated:       {translated}")
    print(f"   Coords updated:   {coords_updated}")
    print(f"   Not found:        {len(not_found)}")

    if not_found_counter:
        print(f"\n⚠️  Unmatched Sinhala cities (top 20):")
        sorted_nf = sorted(
            not_found_counter.items(),
            key=lambda x: x[1],
            reverse=True
        )
        for city, count in sorted_nf[:20]:
            print(f"   '{city}' → {count} times")

    print(f"\n📄 Output: {OUTPUT_CSV}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
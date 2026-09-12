import csv
import os
import re

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_CSV = "../data/raw/extracted/1st-converted.csv"
OUTPUT_CSV = "../data/raw/extracted/2nd-converted.csv"


# ============================================================
# ශ්‍රී ලංකාවේ නගර → (district, latitude, longitude)
# ============================================================

CITY_DATA = {
    # ===== බස්නාහිර පළාත =====
    'Colombo': ('Colombo', 6.9271, 79.8612),
    'කොළඹ': ('Colombo', 6.9271, 79.8612),
    'Dehiwala': ('Colombo', 6.8511, 79.8653),
    'දෙහිවල': ('Colombo', 6.8511, 79.8653),
    'Moratuwa': ('Colombo', 6.7730, 79.8816),
    'මොරටුව': ('Colombo', 6.7730, 79.8816),
    'Kotte': ('Colombo', 6.8890, 79.9017),
    'කෝට්ටේ': ('Colombo', 6.8890, 79.9017),
    'Homagama': ('Colombo', 6.8408, 80.0022),
    'හෝමාගම': ('Colombo', 6.8408, 80.0022),
    'Maharagama': ('Colombo', 6.8480, 79.9265),
    'මහරගම': ('Colombo', 6.8480, 79.9265),
    'Kottawa': ('Colombo', 6.8412, 79.9653),
    'කොට්ටාව': ('Colombo', 6.8412, 79.9653),
    'Piliyandala': ('Colombo', 6.8010, 79.9228),
    'පිළියන්දල': ('Colombo', 6.8010, 79.9228),
    'Kesbewa': ('Colombo', 6.7950, 79.9390),
    'කැස්බෑව': ('Colombo', 6.7950, 79.9390),
    'Boralesgamuwa': ('Colombo', 6.8389, 79.9003),
    'බොරලැස්ගමුව': ('Colombo', 6.8389, 79.9003),
    'Nugegoda': ('Colombo', 6.8649, 79.8997),
    'නුගේගොඩ': ('Colombo', 6.8649, 79.8997),
    'Rajagiriya': ('Colombo', 6.9095, 79.8937),
    'රාජගිරිය': ('Colombo', 6.9095, 79.8937),
    'Battaramulla': ('Colombo', 6.8980, 79.9180),
    'බත්තරමුල්ල': ('Colombo', 6.8980, 79.9180),
    'Kaduwela': ('Colombo', 6.9333, 79.9833),
    'කඩුවෙල': ('Colombo', 6.9333, 79.9833),
    'Kolonnawa': ('Colombo', 6.9333, 79.8833),
    'කොලොන්නාව': ('Colombo', 6.9333, 79.8833),
    'Kelaniya': ('Gampaha', 6.9553, 79.9219),
    'කැළණිය': ('Gampaha', 6.9553, 79.9219),
    'Wattala': ('Gampaha', 6.9897, 79.8917),
    'වත්තල': ('Gampaha', 6.9897, 79.8917),
    'Ja-Ela': ('Gampaha', 7.0744, 79.8919),
    'ජා-ඇල': ('Gampaha', 7.0744, 79.8919),
    'Negombo': ('Gampaha', 7.2083, 79.8358),
    'මීගමුව': ('Gampaha', 7.2083, 79.8358),
    'Katunayake': ('Gampaha', 7.1697, 79.8844),
    'කටුනායක': ('Gampaha', 7.1697, 79.8844),
    'Seeduwa': ('Gampaha', 7.1280, 79.8860),
    'සීදූව': ('Gampaha', 7.1280, 79.8860),
    'Minuwangoda': ('Gampaha', 7.1667, 79.9500),
    'මිනුවන්ගොඩ': ('Gampaha', 7.1667, 79.9500),
    'Gampaha': ('Gampaha', 7.0917, 79.9997),
    'ගම්පහ': ('Gampaha', 7.0917, 79.9997),
    'Kadawatha': ('Gampaha', 7.0000, 79.9500),
    'කඩවත': ('Gampaha', 7.0000, 79.9500),
    'Kiribathgoda': ('Gampaha', 6.9786, 79.9283),
    'කිරිබත්ගොඩ': ('Gampaha', 6.9786, 79.9283),
    'Ragama': ('Gampaha', 7.0289, 79.9175),
    'රාගම': ('Gampaha', 7.0289, 79.9175),
    'Nittambuwa': ('Gampaha', 7.1417, 80.0958),
    'නිට්ටඹුව': ('Gampaha', 7.1417, 80.0958),
    'Veyangoda': ('Gampaha', 7.1500, 80.0500),
    'වේයන්ගොඩ': ('Gampaha', 7.1500, 80.0500),
    'Mirigama': ('Gampaha', 7.2333, 80.1167),
    'මීරිගම': ('Gampaha', 7.2333, 80.1167),
    'Divulapitiya': ('Gampaha', 7.2167, 80.0000),
    'දිවුලපිටිය': ('Gampaha', 7.2167, 80.0000),

    # ===== මධ්‍යම පළාත =====
    'Kandy': ('Kandy', 7.2906, 80.6337),
    'මහනුවර': ('Kandy', 7.2906, 80.6337),
    'නුවර': ('Kandy', 7.2906, 80.6337),
    'Peradeniya': ('Kandy', 7.2597, 80.5967),
    'පේරාදෙණිය': ('Kandy', 7.2597, 80.5967),
    'Katugastota': ('Kandy', 7.3167, 80.6333),
    'කටුගස්තොට': ('Kandy', 7.3167, 80.6333),
    'Gampola': ('Kandy', 7.1667, 80.5667),
    'ගම්පොල': ('Kandy', 7.1667, 80.5667),
    'Nawalapitiya': ('Kandy', 7.0500, 80.5333),
    'නාවලපිටිය': ('Kandy', 7.0500, 80.5333),
    'Kadugannawa': ('Kandy', 7.2500, 80.5167),
    'කඩුගන්නාව': ('Kandy', 7.2500, 80.5167),
    'Digana': ('Kandy', 7.2833, 80.7333),
    'දිගන': ('Kandy', 7.2833, 80.7333),
    'Kundasale': ('Kandy', 7.2833, 80.6833),
    'කුණ්ඩසාලේ': ('Kandy', 7.2833, 80.6833),
    'Matale': ('Matale', 7.4675, 80.6234),
    'මාතලේ': ('Matale', 7.4675, 80.6234),
    'Dambulla': ('Matale', 7.8600, 80.6517),
    'දඹුල්ල': ('Matale', 7.8600, 80.6517),
    'Sigiriya': ('Matale', 7.9569, 80.7594),
    'සීගිරිය': ('Matale', 7.9569, 80.7594),
    'Rattota': ('Matale', 7.5167, 80.6833),
    'රත්තොට': ('Matale', 7.5167, 80.6833),
    'Galewela': ('Matale', 7.7500, 80.5667),
    'ගලේවෙල': ('Matale', 7.7500, 80.5667),
    'Nuwara Eliya': ('Nuwara Eliya', 6.9497, 80.7891),
    'නුවරඑළිය': ('Nuwara Eliya', 6.9497, 80.7891),
    'Hatton': ('Nuwara Eliya', 6.8917, 80.5958),
    'හැටන්': ('Nuwara Eliya', 6.8917, 80.5958),
    'Talawakele': ('Nuwara Eliya', 6.9333, 80.6500),
    'තලවකැලේ': ('Nuwara Eliya', 6.9333, 80.6500),
    'Ginigathhena': ('Nuwara Eliya', 6.9833, 80.4833),
    'ගිනිගත්හේන': ('Nuwara Eliya', 6.9833, 80.4833),
    'Ragala': ('Nuwara Eliya', 6.9833, 80.7667),
    'රාගල': ('Nuwara Eliya', 6.9833, 80.7667),
    'Maskeliya': ('Nuwara Eliya', 6.8333, 80.5667),
    'මස්කෙළිය': ('Nuwara Eliya', 6.8333, 80.5667),
    'Nallathanniya': ('Nuwara Eliya', 6.8000, 80.5000),
    'නල්ලතන්නිය': ('Nuwara Eliya', 6.8000, 80.5000),
    'Norwood': ('Nuwara Eliya', 6.8333, 80.6167),
    'නෝර්වුඩ්': ('Nuwara Eliya', 6.8333, 80.6167),
    'Kotagala': ('Nuwara Eliya', 6.9000, 80.6167),
    'කොටගල': ('Nuwara Eliya', 6.9000, 80.6167),
    'Watagoda': ('Nuwara Eliya', 6.9500, 80.6000),
    'වටගොඩ': ('Nuwara Eliya', 6.9500, 80.6000),

    # ===== දකුණු පළාත =====
    'Galle': ('Galle', 6.0535, 80.2210),
    'ගාල්ල': ('Galle', 6.0535, 80.2210),
    'ගාලු': ('Galle', 6.0535, 80.2210),
    'Hikkaduwa': ('Galle', 6.1395, 80.1011),
    'හික්කඩුව': ('Galle', 6.1395, 80.1011),
    'Ambalangoda': ('Galle', 6.2358, 80.0536),
    'අම්බලන්ගොඩ': ('Galle', 6.2358, 80.0536),
    'Balapitiya': ('Galle', 6.2833, 80.0333),
    'බලපිටිය': ('Galle', 6.2833, 80.0333),
    'Elpitiya': ('Galle', 6.2833, 80.1667),
    'ඇල්පිටිය': ('Galle', 6.2833, 80.1667),
    'Baddegama': ('Galle', 6.1667, 80.1833),
    'බද්දේගම': ('Galle', 6.1667, 80.1833),
    'Matara': ('Matara', 5.9485, 80.5353),
    'මාතර': ('Matara', 5.9485, 80.5353),
    'Weligama': ('Matara', 5.9750, 80.4297),
    'වැලිගම': ('Matara', 5.9750, 80.4297),
    'Mirissa': ('Matara', 5.9483, 80.4589),
    'මිරිස්ස': ('Matara', 5.9483, 80.4589),
    'Dikwella': ('Matara', 5.9667, 80.6833),
    'දික්වැල්ල': ('Matara', 5.9667, 80.6833),
    'Tangalle': ('Hambantota', 6.0239, 80.7944),
    'තංගල්ල': ('Hambantota', 6.0239, 80.7944),
    'Hambantota': ('Hambantota', 6.1246, 81.1185),
    'හම්බන්තොට': ('Hambantota', 6.1246, 81.1185),
    'Tissamaharama': ('Hambantota', 6.2786, 81.2894),
    'තිස්සමහාරාම': ('Hambantota', 6.2786, 81.2894),
    'Kataragama': ('Hambantota', 6.4134, 81.3346),
    'කතරගම': ('Hambantota', 6.4134, 81.3346),
    'Beliatta': ('Hambantota', 6.0500, 80.7500),
    'බෙලිඅත්ත': ('Hambantota', 6.0500, 80.7500),
    'Weeravila': ('Hambantota', 6.1500, 80.9333),
    'වීරවිල': ('Hambantota', 6.1500, 80.9333),

    # ===== උතුරු පළාත =====
    'Jaffna': ('Jaffna', 9.6615, 80.0255),
    'යාපනය': ('Jaffna', 9.6615, 80.0255),
    'Chavakachcheri': ('Jaffna', 9.6500, 80.1667),
    'චාවකච්චේරි': ('Jaffna', 9.6500, 80.1667),
    'Point Pedro': ('Jaffna', 9.8167, 80.2333),
    'පේදුරුතුඩුව': ('Jaffna', 9.8167, 80.2333),
    'Karainagar': ('Jaffna', 9.7333, 79.9000),
    'කරයිනගර්': ('Jaffna', 9.7333, 79.9000),
    'Kayts': ('Jaffna', 9.7000, 79.8500),
    'කයිට්ස්': ('Jaffna', 9.7000, 79.8500),
    'Delft': ('Jaffna', 9.5167, 79.6833),
    'ඩෙල්ෆ්': ('Jaffna', 9.5167, 79.6833),
    'Nainativu': ('Jaffna', 9.6167, 79.7667),
    'නාගදීප': ('Jaffna', 9.6167, 79.7667),
    'Kilinochchi': ('Kilinochchi', 9.3961, 80.3981),
    'කිලිනොච්චි': ('Kilinochchi', 9.3961, 80.3981),
    'Paranthan': ('Kilinochchi', 9.4500, 80.4000),
    'පරන්තන්': ('Kilinochchi', 9.4500, 80.4000),
    'Mullaitivu': ('Mullaitivu', 9.2671, 80.8142),
    'මුලතිව්': ('Mullaitivu', 9.2671, 80.8142),
    'Puthukkudiyiruppu': ('Mullaitivu', 9.3167, 80.6000),
    'පුදුකුඩිඉරිප්පු': ('Mullaitivu', 9.3167, 80.6000),
    'Oddusuddan': ('Mullaitivu', 9.1500, 80.6500),
    'ඔඩ්ඩුසුඩාන්': ('Mullaitivu', 9.1500, 80.6500),
    'Mankulam': ('Mullaitivu', 9.1500, 80.4500),
    'මාන්කුලම': ('Mullaitivu', 9.1500, 80.4500),
    'Vavuniya': ('Vavuniya', 8.7514, 80.4971),
    'වවුනියාව': ('Vavuniya', 8.7514, 80.4971),
    'Nedunkeni': ('Vavuniya', 8.9500, 80.3500),
    'නෙදුන්කේනි': ('Vavuniya', 8.9500, 80.3500),
    'Cheddikulam': ('Vavuniya', 8.8500, 80.3000),
    'චෙඩ්ඩිකුලම': ('Vavuniya', 8.8500, 80.3000),

    # ===== නැගෙනහිර පළාත =====
    'Trincomalee': ('Trincomalee', 8.5874, 81.2152),
    'ත්‍රිකුණාමලය': ('Trincomalee', 8.5874, 81.2152),
    'Kinniya': ('Trincomalee', 8.5000, 81.1833),
    'කින්නියා': ('Trincomalee', 8.5000, 81.1833),
    'Muttur': ('Trincomalee', 8.4500, 81.2667),
    'මුතූර්': ('Trincomalee', 8.4500, 81.2667),
    'Kantale': ('Trincomalee', 8.3500, 81.0000),
    'කන්තලේ': ('Trincomalee', 8.3500, 81.0000),
    'Serunuwara': ('Trincomalee', 8.3667, 81.1000),
    'සේරුනුවර': ('Trincomalee', 8.3667, 81.1000),
    'Nilaveli': ('Trincomalee', 8.6833, 81.2000),
    'නිලාවේලි': ('Trincomalee', 8.6833, 81.2000),
    'Pulmoddai': ('Trincomalee', 8.9500, 81.0000),
    'පුල්මුඩෙයි': ('Trincomalee', 8.9500, 81.0000),
    'Batticaloa': ('Batticaloa', 7.7102, 81.6924),
    'මඩකලපුව': ('Batticaloa', 7.7102, 81.6924),
    'Kattankudy': ('Batticaloa', 7.6833, 81.7333),
    'කාත්තාන්කුඩි': ('Batticaloa', 7.6833, 81.7333),
    'Eravur': ('Batticaloa', 7.7667, 81.6000),
    'එරාවූර්': ('Batticaloa', 7.7667, 81.6000),
    'Valaichchenai': ('Batticaloa', 7.9167, 81.5333),
    'වාලච්චේන': ('Batticaloa', 7.9167, 81.5333),
    'Chenkalady': ('Batticaloa', 7.8500, 81.5667),
    'චෙන්කලඩි': ('Batticaloa', 7.8500, 81.5667),
    'Vakarai': ('Batticaloa', 8.1333, 81.4333),
    'වාකරේ': ('Batticaloa', 8.1333, 81.4333),
    'Ampara': ('Ampara', 7.2975, 81.6820),
    'අම්පාර': ('Ampara', 7.2975, 81.6820),
    'Kalmunai': ('Ampara', 7.4167, 81.8333),
    'කල්මුණේ': ('Ampara', 7.4167, 81.8333),
    'Sainthamaruthu': ('Ampara', 7.4000, 81.8333),
    'සයින්දමරුදු': ('Ampara', 7.4000, 81.8333),
    'Akkaraipattu': ('Ampara', 7.2167, 81.8500),
    'අක්කරෙයිපත්තුව': ('Ampara', 7.2167, 81.8500),
    'Pottuvil': ('Ampara', 6.8667, 81.8333),
    'පොතුවිල්': ('Ampara', 6.8667, 81.8333),
    'Arugam Bay': ('Ampara', 6.8400, 81.8360),
    'අරුගම්බේ': ('Ampara', 6.8400, 81.8360),
    'Tirukkovil': ('Ampara', 6.8333, 81.8500),
    'තිරුක්කෝවිල්': ('Ampara', 6.8333, 81.8500),
    'Maha Oya': ('Ampara', 7.5000, 81.3333),
    'මහඔය': ('Ampara', 7.5000, 81.3333),

    # ===== වයඹ පළාත =====
    'Kurunegala': ('Kurunegala', 7.4863, 80.3623),
    'කුරුණෑගල': ('Kurunegala', 7.4863, 80.3623),
    'Polgahawela': ('Kurunegala', 7.3333, 80.3000),
    'පොල්ගහවෙල': ('Kurunegala', 7.3333, 80.3000),
    'Narammala': ('Kurunegala', 7.4333, 80.2000),
    'නාරම්මල': ('Kurunegala', 7.4333, 80.2000),
    'Alawwa': ('Kurunegala', 7.3000, 80.2333),
    'අලව්ව': ('Kurunegala', 7.3000, 80.2333),
    'Melsiripura': ('Kurunegala', 7.4833, 80.5167),
    'මැල්සිරිපුර': ('Kurunegala', 7.4833, 80.5167),
    'Kuliyapitiya': ('Kurunegala', 7.4667, 80.0333),
    'කුලියාපිටිය': ('Kurunegala', 7.4667, 80.0333),
    'Wariyapola': ('Kurunegala', 7.6167, 80.2333),
    'වාරියපොල': ('Kurunegala', 7.6167, 80.2333),
    'Maho': ('Kurunegala', 7.8167, 80.2833),
    'මහව': ('Kurunegala', 7.8167, 80.2833),
    'Puttalam': ('Puttalam', 8.0362, 79.8283),
    'පුත්තලම': ('Puttalam', 8.0362, 79.8283),
    'Chilaw': ('Puttalam', 7.5758, 79.7953),
    'හලාවත': ('Puttalam', 7.5758, 79.7953),
    'Wennappuwa': ('Puttalam', 7.3500, 79.8333),
    'වෙන්නප්පුව': ('Puttalam', 7.3500, 79.8333),
    'Marawila': ('Puttalam', 7.4167, 79.8167),
    'මාරවිල': ('Puttalam', 7.4167, 79.8167),
    'Dankotuwa': ('Puttalam', 7.3000, 79.9000),
    'දංකොටුව': ('Puttalam', 7.3000, 79.9000),
    'Nattandiya': ('Puttalam', 7.4167, 79.9167),
    'නාත්තණ්ඩිය': ('Puttalam', 7.4167, 79.9167),
    'Anamaduwa': ('Puttalam', 8.0167, 80.0167),
    'ආණමඩුව': ('Puttalam', 8.0167, 80.0167),
    'Kalpitiya': ('Puttalam', 8.2333, 79.7667),
    'කල්පිටිය': ('Puttalam', 8.2333, 79.7667),

    # ===== උතුරු මැද පළාත =====
    'Anuradhapura': ('Anuradhapura', 8.3114, 80.4037),
    'අනුරාධපුර': ('Anuradhapura', 8.3114, 80.4037),
    'Mihintale': ('Anuradhapura', 8.3500, 80.5167),
    'මිහින්තලය': ('Anuradhapura', 8.3500, 80.5167),
    'Kekirawa': ('Anuradhapura', 8.0333, 80.6000),
    'කැකිරාව': ('Anuradhapura', 8.0333, 80.6000),
    'Habarana': ('Anuradhapura', 8.0333, 80.7500),
    'හබරණ': ('Anuradhapura', 8.0333, 80.7500),
    'Thambuttegama': ('Anuradhapura', 8.1500, 80.4000),
    'තඹුත්තේගම': ('Anuradhapura', 8.1500, 80.4000),
    'Medawachchiya': ('Anuradhapura', 8.5333, 80.5000),
    'මැදවච්චිය': ('Anuradhapura', 8.5333, 80.5000),
    'Kebithigollewa': ('Anuradhapura', 8.6500, 80.6667),
    'කැබිතිගොල්ලෑව': ('Anuradhapura', 8.6500, 80.6667),
    'Talawa': ('Anuradhapura', 8.2333, 80.3500),
    'තලාව': ('Anuradhapura', 8.2333, 80.3500),
    'Polonnaruwa': ('Polonnaruwa', 7.9403, 81.0188),
    'පොළොන්නරුව': ('Polonnaruwa', 7.9403, 81.0188),
    'Hingurakgoda': ('Polonnaruwa', 8.0500, 80.9500),
    'හිඟුරක්ගොඩ': ('Polonnaruwa', 8.0500, 80.9500),
    'Minneriya': ('Polonnaruwa', 8.0333, 80.8833),
    'මින්නේරිය': ('Polonnaruwa', 8.0333, 80.8833),
    'Medirigiriya': ('Polonnaruwa', 8.1500, 80.9333),
    'මැදිරිගිරිය': ('Polonnaruwa', 8.1500, 80.9333),

    # ===== ඌව පළාත =====
    'Badulla': ('Badulla', 6.9934, 81.0550),
    'බදුල්ල': ('Badulla', 6.9934, 81.0550),
    'Bandarawela': ('Badulla', 6.8333, 80.9833),
    'බණ්ඩාරවෙල': ('Badulla', 6.8333, 80.9833),
    'Haputale': ('Badulla', 6.7667, 80.9500),
    'හපුතලේ': ('Badulla', 6.7667, 80.9500),
    'Diyatalawa': ('Badulla', 6.8167, 80.9667),
    'දියතලාව': ('Badulla', 6.8167, 80.9667),
    'Welimada': ('Badulla', 6.9000, 80.9000),
    'වැලිමඩ': ('Badulla', 6.9000, 80.9000),
    'Passara': ('Badulla', 6.9333, 81.1500),
    'පස්සර': ('Badulla', 6.9333, 81.1500),
    'Ella': ('Badulla', 6.8667, 81.0500),
    'ඇල්ල': ('Badulla', 6.8667, 81.0500),
    'Mahiyanganaya': ('Badulla', 7.3333, 81.0000),
    'මහියංගනය': ('Badulla', 7.3333, 81.0000),
    'Hali-Ela': ('Badulla', 6.9667, 81.0333),
    'හාලිඇල': ('Badulla', 6.9667, 81.0333),
    'Monaragala': ('Monaragala', 6.8728, 81.3507),
    'මොණරාගල': ('Monaragala', 6.8728, 81.3507),
    'Wellawaya': ('Monaragala', 6.7333, 81.1000),
    'වැල්ලවාය': ('Monaragala', 6.7333, 81.1000),
    'Buttala': ('Monaragala', 6.7500, 81.2333),
    'බුත්තල': ('Monaragala', 6.7500, 81.2333),
    'Bibile': ('Monaragala', 7.1667, 81.2167),
    'බිබිල': ('Monaragala', 7.1667, 81.2167),
    'Siyambalanduwa': ('Monaragala', 6.9000, 81.5333),
    'සියඹලාණ්ඩුව': ('Monaragala', 6.9000, 81.5333),

    # ===== සබරගමුව පළාත =====
    'Ratnapura': ('Ratnapura', 6.6828, 80.3992),
    'රත්නපුර': ('Ratnapura', 6.6828, 80.3992),
    'Kuruwita': ('Ratnapura', 6.7833, 80.3667),
    'කුරුවිට': ('Ratnapura', 6.7833, 80.3667),
    'Eheliyagoda': ('Ratnapura', 6.7500, 80.2667),
    'ඇහැලියගොඩ': ('Ratnapura', 6.7500, 80.2667),
    'Balangoda': ('Ratnapura', 6.6500, 80.7000),
    'බලංගොඩ': ('Ratnapura', 6.6500, 80.7000),
    'Kegalle': ('Kegalle', 7.2513, 80.3464),
    'කෑගල්ල': ('Kegalle', 7.2513, 80.3464),
    'Mawanella': ('Kegalle', 7.2500, 80.4500),
    'මාවනැල්ල': ('Kegalle', 7.2500, 80.4500),
    'Warakapola': ('Kegalle', 7.2333, 80.2000),
    'වරකාපොල': ('Kegalle', 7.2333, 80.2000),
    'Rambukkana': ('Kegalle', 7.3167, 80.4000),
    'රඹුක්කන': ('Kegalle', 7.3167, 80.4000),
    'Galigamuwa': ('Kegalle', 7.1833, 80.2833),
    'ගලිගමුව': ('Kegalle', 7.1833, 80.2833),

    # ===== අනෙකුත් ප්‍රධාන ස්ථාන =====
    'Avissawella': ('Colombo', 6.9533, 80.2097),
    'අවිස්සාවේල්ල': ('Colombo', 6.9533, 80.2097),
    'Hanwella': ('Colombo', 6.9000, 80.0833),
    'හංවැල්ල': ('Colombo', 6.9000, 80.0833),
    'Padukka': ('Colombo', 6.8408, 80.0925),
    'පාදුක්ක': ('Colombo', 6.8408, 80.0925),
    'Horana': ('Kalutara', 6.7156, 80.0631),
    'හොරණ': ('Kalutara', 6.7156, 80.0631),
    'Bandaragama': ('Kalutara', 6.7133, 79.9072),
    'බණ්ඩාරගම': ('Kalutara', 6.7133, 79.9072),
    'Panadura': ('Kalutara', 6.7133, 79.9072),
    'පානදුර': ('Kalutara', 6.7133, 79.9072),
    'Kalutara': ('Kalutara', 6.5854, 79.9607),
    'කළුතර': ('Kalutara', 6.5854, 79.9607),
    'Beruwala': ('Kalutara', 6.4789, 79.9828),
    'බේරුවල': ('Kalutara', 6.4789, 79.9828),
    'Aluthgama': ('Kalutara', 6.4333, 79.9958),
    'අලුත්ගම': ('Kalutara', 6.4333, 79.9958),
    'Bentota': ('Kalutara', 6.4200, 79.9960),
    'බෙන්තොට': ('Kalutara', 6.4200, 79.9960),
    'Matugama': ('Kalutara', 6.5222, 80.1167),
    'මතුගම': ('Kalutara', 6.5222, 80.1167),
    'Ingiriya': ('Kalutara', 6.7500, 80.1667),
    'ඉංගිරිය': ('Kalutara', 6.7500, 80.1667),
    # ==== CSV data එකේ හමුවුණු missing cities ====

    # Colombo District
    'Athurugiriya': ('Colombo', 6.8756, 79.9989),
    'Malabe': ('Colombo', 6.9061, 79.9578),
    'Pannipitiya': ('Colombo', 6.8467, 79.9386),
    'Borella': ('Colombo', 6.9147, 79.8776),
    'Maradana': ('Colombo', 6.9297, 79.8650),
    'Wellawatte': ('Colombo', 6.8746, 79.8594),
    'Bambalapitiya': ('Colombo', 6.8905, 79.8565),
    'Mount Lavinia': ('Colombo', 6.8389, 79.8636),
    'Ratmalana': ('Colombo', 6.8199, 79.8865),
    'Nawala': ('Colombo', 6.8926, 79.8874),

    # Gampaha District
    'Biyagama': ('Gampaha', 6.9500, 79.9833),
    'Delgoda': ('Gampaha', 6.9833, 80.0000),
    'Kirindiwela': ('Gampaha', 7.0333, 80.1167),
    'Ganemulla': ('Gampaha', 7.0667, 79.9667),
    'Weliweriya': ('Gampaha', 7.0333, 80.0333),
    'Dekatana': ('Gampaha', 7.0333, 80.0500),
    'Kaduwela': ('Colombo', 6.9333, 79.9833),

    # Kalutara District
    'Wadduwa': ('Kalutara', 6.6667, 79.9333),
    'Waskaduwa': ('Kalutara', 6.6333, 79.9333),
    'Katukurunda': ('Kalutara', 6.6167, 79.9500),
    'Dodangoda': ('Kalutara', 6.5500, 80.0167),
    'Millaniya': ('Kalutara', 6.5833, 80.0333),
    'Bulathsinhala': ('Kalutara', 6.6500, 80.1500),
    'Agalawatta': ('Kalutara', 6.6167, 80.2167),

    # Kandy District
    'Theldeniya': ('Kandy', 7.2833, 80.8000),
    'Teldeniya': ('Kandy', 7.2833, 80.8000),
    'Pallekele': ('Kandy', 7.2833, 80.7000),
    'Hanguranketha': ('Kandy', 7.1833, 80.7833),
    'Rikillagaskada': ('Kandy', 7.2000, 80.7833),
    'Wattegama': ('Kandy', 7.3500, 80.6833),
    'Hasalaka': ('Kandy', 7.3667, 80.8333),

    # Nuwara Eliya District
    'Bogawantalawa': ('Nuwara Eliya', 6.8167, 80.6500),
    'Dayagama': ('Nuwara Eliya', 6.8500, 80.6667),
    'Dickoya': ('Nuwara Eliya', 6.8667, 80.6167),
    'Norton Bridge': ('Nuwara Eliya', 6.9333, 80.5167),
    'Pundaluoya': ('Nuwara Eliya', 7.0167, 80.6500),
    'Ramboda': ('Nuwara Eliya', 7.0500, 80.6833),
    'Walapane': ('Nuwara Eliya', 7.0833, 80.8500),
    'Kandapola': ('Nuwara Eliya', 6.9833, 80.8000),
    'Agarapatana': ('Nuwara Eliya', 6.8333, 80.7333),

    # Galle District
    'Karapitiya': ('Galle', 6.0667, 80.2167),
    'Unawatuna': ('Galle', 6.0167, 80.2500),
    'Ahangama': ('Galle', 5.9667, 80.3667),
    'Ahungalla': ('Galle', 6.3167, 80.0333),
    'Batapola': ('Galle', 6.2333, 80.1167),
    'Habaraduwa': ('Galle', 5.9833, 80.3000),
    'Koggala': ('Galle', 5.9833, 80.3167),
    'Baddegama': ('Galle', 6.1667, 80.1833),

    # Matara District
    'Akuressa': ('Matara', 6.1000, 80.4833),
    'Deniyaya': ('Matara', 6.3333, 80.5500),
    'Hakmana': ('Matara', 6.0667, 80.6333),
    'Kamburupitiya': ('Matara', 6.0833, 80.5667),
    'Devinuwara': ('Matara', 5.9333, 80.5833),
    'Gandara': ('Matara', 5.9500, 80.6167),
    'Kotapola': ('Matara', 6.3000, 80.5667),
    'Pasgoda': ('Matara', 6.2500, 80.6333),
    'Pitabeddara': ('Matara', 6.2000, 80.4667),

    # Hambantota District
    'Ambalantota': ('Hambantota', 6.1167, 81.0167),
    'Angunakolapelessa': ('Hambantota', 6.1500, 80.9500),
    'Lunugamvehera': ('Hambantota', 6.3667, 81.1833),
    'Sooriyawewa': ('Hambantota', 6.3167, 81.0500),
    'Suriyawewa': ('Hambantota', 6.3167, 81.0500),
    'Walasmulla': ('Hambantota', 6.1500, 80.7000),
    'Middeniya': ('Hambantota', 6.2333, 80.7333),
    'Katuwana': ('Hambantota', 6.2000, 80.6833),
    'Netolpitiya': ('Hambantota', 6.0333, 80.7833),
    'Ranna': ('Hambantota', 6.0667, 80.8500),
    'Hungama': ('Hambantota', 6.1167, 80.8333),

    # Jaffna District
    'Kopay': ('Jaffna', 9.7167, 80.0500),
    'Kodikamam': ('Jaffna', 9.6833, 80.1000),
    'Manipay': ('Jaffna', 9.7333, 79.9833),
    'Nelliady': ('Jaffna', 9.8000, 80.0833),
    'Vaddukoddai': ('Jaffna', 9.7333, 79.9500),
    'Tellippalai': ('Jaffna', 9.7833, 80.0333),
    'Uduvil': ('Jaffna', 9.7333, 80.0000),
    'Sandilipay': ('Jaffna', 9.7333, 79.9833),

    # Kilinochchi District
    'Pallai': ('Kilinochchi', 9.5833, 80.4667),
    'Poonakary': ('Kilinochchi', 9.4667, 80.1667),
    'Dharmapuram': ('Kilinochchi', 9.4833, 80.4167),
    'Iranamadu': ('Kilinochchi', 9.3167, 80.4333),
    'Mulankavil': ('Kilinochchi', 9.4833, 80.2000),

    # Mullaitivu District
    'Thunukkai': ('Mullaitivu', 9.1500, 80.4333),
    'Maritimepattu': ('Mullaitivu', 9.2333, 80.7667),
    'Welioya': ('Mullaitivu', 8.9667, 80.7667),

    # Vavuniya District
    'Omanthai': ('Vavuniya', 8.8333, 80.5000),
    'Kanagarayankulam': ('Vavuniya', 8.9667, 80.4167),
    'Mamaduwa': ('Vavuniya', 8.8000, 80.4167),
    'Vavunikulam': ('Vavuniya', 8.9167, 80.4667),

    # Trincomalee District
    'Thampalakamam': ('Trincomalee', 8.4667, 81.0833),
    'Kuchchaveli': ('Trincomalee', 8.8167, 81.1000),
    'Gomarankadawala': ('Trincomalee', 8.6500, 80.9167),
    'Padaviya': ('Trincomalee', 8.8333, 80.9000),
    'Thoppur': ('Trincomalee', 8.5500, 81.1500),
    'Eachchilampattu': ('Trincomalee', 8.3167, 81.3833),
    'Verugal': ('Trincomalee', 8.2500, 81.4167),

    # Batticaloa District
    'Arayampathy': ('Batticaloa', 7.7500, 81.7500),
    'Kiran': ('Batticaloa', 7.8667, 81.5333),
    'Vellavely': ('Batticaloa', 7.6833, 81.6000),
    'Paddiruppu': ('Batticaloa', 7.6500, 81.6667),
    'Kaluwanchikudy': ('Batticaloa', 7.5833, 81.7500),
    'Kalkudah': ('Batticaloa', 7.9167, 81.5000),

    # Ampara District
    'Dehiattakandiya': ('Ampara', 7.6167, 81.0333),
    'Damana': ('Ampara', 7.4500, 81.2167),
    'Uhana': ('Ampara', 7.3333, 81.6333),
    'Padiyatalawa': ('Ampara', 7.4000, 81.2833),
    'Lahugala': ('Ampara', 6.8833, 81.7167),
    'Nintavur': ('Ampara', 7.4167, 81.8000),
    'Ninthavur': ('Ampara', 7.4167, 81.8000),
    'Addalaichenai': ('Ampara', 7.2667, 81.8500),
    'Irakkamam': ('Ampara', 7.3167, 81.7667),
    'Karativu': ('Ampara', 7.3833, 81.8167),
    'Sammanthurai': ('Ampara', 7.3667, 81.8000),
    'Alayadivembu': ('Ampara', 7.0833, 81.8500),
    'Navithanveli': ('Ampara', 7.3500, 81.7833),

    # Kurunegala District
    'Bingiriya': ('Kurunegala', 7.6000, 79.9167),
    'Ibbagamuwa': ('Kurunegala', 7.5167, 80.4167),
    'Kobeigane': ('Kurunegala', 7.6667, 80.0333),
    'Katupotha': ('Kurunegala', 7.5000, 80.2500),
    'Weerambugedara': ('Kurunegala', 7.4667, 80.3500),
    'Polpitigama': ('Kurunegala', 7.6500, 80.4500),
    'Rideegama': ('Kurunegala', 7.5333, 80.5000),
    'Mawathagama': ('Kurunegala', 7.4167, 80.4333),
    'Mallawapitiya': ('Kurunegala', 7.4667, 80.3667),
    'Nikaweratiya': ('Kurunegala', 7.7500, 80.1167),
    'Panduwasnuwara': ('Kurunegala', 7.5833, 80.0500),
    'Rasnayakapura': ('Kurunegala', 7.7167, 80.0500),
    'Bamunakotuwa': ('Kurunegala', 7.6000, 80.1500),
    'Ganewatta': ('Kurunegala', 7.6333, 80.3167),
    'Kotawehera': ('Kurunegala', 7.8500, 80.1500),
    'Ehetuwewa': ('Kurunegala', 7.8667, 80.2000),
    'Galgamuwa': ('Kurunegala', 8.0000, 80.2833),
    'Ambanpola': ('Kurunegala', 7.9167, 80.3167),

    # Puttalam District
    'Mundalama': ('Puttalam', 8.1000, 79.8167),
    'Madampe': ('Puttalam', 7.5000, 79.8333),
    'Arachchikattuwa': ('Puttalam', 7.6500, 79.8500),
    'Pallama': ('Puttalam', 7.9167, 79.9500),
    'Vanathavilluwa': ('Puttalam', 8.4167, 79.8333),
    'Karuwalagaswewa': ('Puttalam', 8.1667, 80.0500),
    'Nawagattegama': ('Puttalam', 7.8500, 80.0000),
    'Mahakumbukkadawala': ('Puttalam', 7.7833, 79.9500),
    'Norochcholai': ('Puttalam', 8.1167, 79.7333),
    'Palaviya': ('Puttalam', 8.1667, 79.7500),
    'Kandakuliya': ('Puttalam', 8.2500, 79.7500),
    'Ettale': ('Puttalam', 8.2000, 79.7667),

    # Anuradhapura District
    'Galenbindunuwewa': ('Anuradhapura', 8.3333, 80.6667),
    'Eppawala': ('Anuradhapura', 8.1500, 80.4167),
    'Rajanganaya': ('Anuradhapura', 8.2000, 80.1833),
    'Nochchiyagama': ('Anuradhapura', 8.3167, 80.2000),
    'Palagala': ('Anuradhapura', 8.2500, 80.5833),
    'Kahatagasdigiliya': ('Anuradhapura', 8.5167, 80.8000),
    'Horowpothana': ('Anuradhapura', 8.6000, 80.8333),
    'Rambewa': ('Anuradhapura', 8.5667, 80.4667),
    'Mahavilachchiya': ('Anuradhapura', 8.5167, 80.2333),
    'Thirappane': ('Anuradhapura', 8.2333, 80.5667),
    'Ipalogama': ('Anuradhapura', 8.2000, 80.4500),
    'Nachchaduwa': ('Anuradhapura', 8.2333, 80.4667),

    # Polonnaruwa District
    'Thamankaduwa': ('Polonnaruwa', 7.9333, 81.0000),
    'Welikanda': ('Polonnaruwa', 7.9333, 81.2333),
    'Dimbulagala': ('Polonnaruwa', 7.9167, 81.0000),
    'Aralaganwila': ('Polonnaruwa', 8.1333, 81.1000),
    'Elahera': ('Polonnaruwa', 8.0333, 80.8000),
    'Lankapura': ('Polonnaruwa', 8.0500, 81.0500),
    'Kaduruwela': ('Polonnaruwa', 7.9333, 81.0167),

    # Badulla District
    'Meegahakiwula': ('Badulla', 7.2000, 81.1500),
    'Kandeketiya': ('Badulla', 7.2500, 80.9833),
    'Rideemaliyadda': ('Badulla', 7.2833, 81.1333),
    'Soranatota': ('Badulla', 7.1500, 81.0333),
    'Uva Paranagama': ('Badulla', 6.9833, 81.0000),
    'Lunugala': ('Badulla', 7.0500, 81.2000),
    'Badalkumbura': ('Badulla', 6.9000, 81.2333),
    'Haldummulla': ('Badulla', 6.7667, 80.8833),
    'Koslanda': ('Badulla', 6.8000, 80.9167),
    'Beragala': ('Badulla', 6.7833, 80.9167),

    # Monaragala District
    'Thanamalwila': ('Monaragala', 6.4333, 81.0333),
    'Kuda Oya': ('Monaragala', 6.6667, 81.2000),
    'Okkampitiya': ('Monaragala', 6.6167, 81.3167),
    'Sewanagala': ('Monaragala', 6.4833, 81.1667),
    'Nakkala': ('Monaragala', 6.9000, 81.4333),
    'Dombagahawela': ('Monaragala', 6.8500, 81.4000),
    'Medagama': ('Monaragala', 6.9500, 81.2333),
    'Madulla': ('Monaragala', 7.0333, 81.3500),

    # Ratnapura District
    'Embilipitiya': ('Ratnapura', 6.3378, 80.8500),
    'Kahawatta': ('Ratnapura', 6.5167, 80.5000),
    'Pelmadulla': ('Ratnapura', 6.6167, 80.5333),
    'Nivithigala': ('Ratnapura', 6.5833, 80.4667),
    'Kalawana': ('Ratnapura', 6.5333, 80.4000),
    'Rakwana': ('Ratnapura', 6.4667, 80.6167),
    'Godakawela': ('Ratnapura', 6.4833, 80.5667),
    'Weligepola': ('Ratnapura', 6.5667, 80.6167),
    'Opanayaka': ('Ratnapura', 6.6333, 80.6500),
    'Ayagama': ('Ratnapura', 6.6500, 80.3167),
    'Kiriella': ('Ratnapura', 6.7500, 80.3667),
    'Elapatha': ('Ratnapura', 6.6500, 80.4167),
    'Imbulpe': ('Ratnapura', 6.6833, 80.7500),
    'Kolonna': ('Ratnapura', 6.4000, 80.6500),
    'Udawalawe': ('Ratnapura', 6.4667, 80.8833),

    # Kegalle District
    'Kitulgala': ('Kegalle', 6.9917, 80.4167),
    'Ruwanwella': ('Kegalle', 7.0500, 80.2500),
    'Yatiyanthota': ('Kegalle', 7.0333, 80.3000),
    'Dehiovita': ('Kegalle', 6.9333, 80.2000),
    'Deraniyagala': ('Kegalle', 6.9333, 80.3500),
    'Aranayaka': ('Kegalle', 7.1500, 80.4833),
    'Bulathkohupitiya': ('Kegalle', 7.1000, 80.4000),
    'Hemmathagama': ('Kegalle', 7.2000, 80.5167),
}


# ============================================================
# ශ්‍රී ලංකාවට අදාළ නැති රටවල් (title/story එකේ තිබේ නම්)
# ============================================================

FOREIGN_COUNTRIES = [
    'ඉන්දියාව', 'ඉන්දියානු', 'India', 'Indian',
    'චීනය', 'චීන', 'China', 'Chinese',
    'ඇමරිකාව', 'ඇමරිකානු', 'America', 'American', 'USA',
    'බංග්ලාදේශය', 'බංග්ලාදේශ', 'Bangladesh',
    'නේපාලය', 'නේපාල', 'Nepal',
    'පාකිස්තානය', 'පාකිස්තාන', 'Pakistan',
    'ජපානය', 'Japan', 'Japanese',
    'කොරියාව', 'Korea', 'Korean',
    'රුසියාව', 'රුසියානු', 'Russia', 'Russian',
    'යුක්රේනය', 'යුක්රේන', 'Ukraine',
    'තුර්කිය', 'Turkey', 'Turkish',
    'ස්පාඤ්ඤය', 'Spain', 'Spanish',
    'ප්‍රංශය', 'France', 'French',
    'ජර්මනිය', 'Germany', 'German',
    'ඉතාලිය', 'Italy', 'Italian',
    'බ්‍රිතාන්‍යය', 'Britain', 'British', 'UK',
    'ඕස්ට්‍රේලියාව', 'Australia', 'Australian',
    'කැනඩාව', 'Canada', 'Canadian',
    'මෙක්සිකෝව', 'Mexico', 'Mexican',
    'බ්‍රසීලය', 'Brazil', 'Brazilian',
    'දක්ෂිණ අප්‍රිකාව', 'South Africa',
    'නයිජීරියාව', 'Nigeria',
    'කෙන්යාව', 'Kenya',
    'උගන්ඩාව', 'Uganda',
    'ඉන්දුනීසියාව', 'Indonesia',
    'මැලේසියාව', 'Malaysia',
    'සිංගප්පූරුව', 'Singapore',
    'තායිලන්තය', 'Thailand',
    'වියට්නාමය', 'Vietnam',
    'පිලිපීනය', 'Philippines',
    'කාම්බෝජය', 'Cambodia',
    'ලාඕසය', 'Laos',
    'මියන්මාරය', 'Myanmar',
    'ඊශ්‍රායලය', 'Israel',
    'පලස්තීනය', 'Palestine',
    'ගාසා', 'Gaza',
    'ලෙබනනය', 'Lebanon',
    'සිරියාව', 'Syria',
    'ඉරාකය', 'Iraq',
    'ඉරානය', 'Iran',
    'සෞදි අරාබිය', 'Saudi Arabia',
    'එක්සත් අරාබි එමීර්', 'UAE', 'Dubai',
    'කටාර්', 'Qatar',
    'කුවේට්', 'Kuwait',
    'ඕමාන්', 'Oman',
    'බහරේන්', 'Bahrain',
    'යේමනය', 'Yemen',
    'ඊජිප්තුව', 'Egypt',
    'ලිබියාව', 'Libya',
    'ටියුනීසියාව', 'Tunisia',
    'ඇල්ජීරියාව', 'Algeria',
    'මොරොක්කෝව', 'Morocco',
    'ටෙනසි', 'Tennessee',
    'ටෙක්සාස්', 'Texas',
    'ෆ්ලොරිඩා', 'Florida',
    'නිව්යෝර්ක්', 'New York',
    'කැලිෆෝනියා', 'California',
    'ලන්ඩන්', 'London',
    'පැරිස්', 'Paris',
    'බර්ලින්', 'Berlin',
    'රෝමය', 'Rome',
    'මැඩ්රිඩ්', 'Madrid',
    'ටෝකියෝ', 'Tokyo',
    'බීජිං', 'Beijing',
    'දිල්ලි', 'Delhi',
    'මුම්බායි', 'Mumbai',
    'චෙන්නායි', 'Chennai',
    'කොල්කතා', 'Kolkata',
    'බැංගලෝර්', 'Bangalore',
    'කත්මණ්ඩු', 'Kathmandu',
    'ඩකා', 'Dhaka',
    'කරච්චි', 'Karachi',
    'ලාහෝර්', 'Lahore',
    'ඉස්තාන්බුල්', 'Istanbul',
    'මොස්කව්', 'Moscow',
    'කියෙව්', 'Kyiv',
    'වොෂින්ටන්', 'Washington',
    'ලොස් ඇන්ජලීස්', 'Los Angeles',
    'ටොරොන්ටෝ', 'Toronto',
    'සිඩ්නි', 'Sydney',
    'මෙල්බර්න්', 'Melbourne',
    'ඕක්ලන්ඩ්', 'Auckland',
    'ජකර්තා', 'Jakarta',
    'බැංකොක්', 'Bangkok',
    'හැනෝයි', 'Hanoi',
    'මැනිලා', 'Manila',
]


# ============================================================
# title/story එකේ තියෙන නගරය හඳුනාගන්න
# ============================================================

def find_city(text):
    """
    text එකේ තියෙන ශ්‍රී ලංකා නගරය හඳුනාගෙන
    (city, district, lat, lon) return කරනවා
    """
    for city, (district, lat, lon) in CITY_DATA.items():
        # වචනය වෙන් වෙන්ව තියෙනවද බලන්න (word boundary)
        if re.search(r'\b' + re.escape(city) + r'\b', text):
            return city, district, lat, lon
    return None, None, None, None


def is_foreign(text):
    """
    text එකේ විදේශීය රටක නමක් තියෙනවද බලනවා
    """
    for country in FOREIGN_COUNTRIES:
        if country in text:
            return True
    return False


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("STEP 2: Add location data (district, city, lat, lon)")
    print("=" * 60)

    # Input file එක තියෙනවද බලන්න
    if not os.path.exists(INPUT_CSV):
        print(f"❌ ERROR: Input file not found: {INPUT_CSV}")
        print()
        print("මුලින්ම 1st script එක run කරන්න.")
        return

    # CSV කියවන්න
    print(f"Loading: {INPUT_CSV}")

    rows = []
    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        for row in reader:
            rows.append(row)

    print(f"✅ Loaded {len(rows)} records.")

    # district, city, latitude, longitude columns නැත්නම් එකතු කරන්න
    extra_cols = ['district', 'city', 'latitude', 'longitude']
    for col in extra_cols:
        if col not in fieldnames:
            fieldnames.append(col)

    # Location data එකතු කරන්න
    kept_rows = []
    sl_count = 0
    foreign_count = 0
    no_location = 0

    for row in rows:
        title = str(row.get('title', ''))
        story = str(row.get('story', ''))
        combined = title + ' ' + story

        # 1. විදේශීයද බලන්න - විදේශීය නම් skip කරන්න
        if is_foreign(combined):
            foreign_count += 1
            continue

        # 2. ශ්‍රී ලංකා නගරයක් හඳුනාගන්න
        city, district, lat, lon = find_city(combined)

        if city is not None:
            sl_count += 1
            row['district'] = district
            row['city'] = city
            row['latitude'] = lat
            row['longitude'] = lon
        else:
            # නගරය හඳුනාගන්න බැරි නම් - හිස් තියන්න
            no_location += 1
            row['district'] = ''
            row['city'] = ''
            row['latitude'] = ''
            row['longitude'] = ''

        kept_rows.append(row)

    # Output folder එක හදන්න
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

    # අලුත් CSV එක ලියන්න (foreign rows skip කර ඇත)
    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(kept_rows)

    # Summary
    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    print(f"Total records loaded   : {len(rows)}")
    print(f"Sri Lanka (city found) : {sl_count}")
    print(f"Sri Lanka (no city)    : {no_location}")
    print(f"Foreign (skipped)      : {foreign_count}")
    print(f"Records written        : {len(kept_rows)}")
    print(f"Output file            : {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == "__main__":
    main()
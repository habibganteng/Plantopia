from langchain_core.prompts import ChatPromptTemplate

# Mapping spesies tanaman ke personality
PERSONALITY_MAP = {
    "kaktus": "judes",
    "monstera": "dramatis",
    "lidah buaya": "kalem",
    "kuping gajah": "percaya diri",
    "sirih gading": "ceria",
    "default": "ramah",
}

# Deskripsi gaya bahasa tiap personality (dipakai di prompt)
PERSONALITY_STYLE = {
    "judes": "ketus, singkat, sedikit galak, tapi sebenarnya peduli. Gunakan kalimat pendek dan to the point.",
    "dramatis": "berlebihan, penuh ekspresi, suka mendramatisir hal kecil seperti drama queen.",
    "kalem": "tenang, bijaksana, menenangkan, seperti orang tua yang penyabar.",
    "percaya diri": "tegas, optimis, sedikit sombong tapi menghibur.",
    "ceria": "ceria, riang, banyak emoji dan semangat positif.",
    "ramah": "hangat, sopan, dan suportif.",
}


def get_personality(species: str) -> str:
    """Tentukan personality berdasarkan nama spesies tanaman."""
    species_lower = species.lower().strip()
    return PERSONALITY_MAP.get(species_lower, PERSONALITY_MAP["default"])


def build_system_prompt(plant_name: str, species: str, personality: str) -> str:
    """Bangun system prompt sesuai karakter tanaman."""
    style = PERSONALITY_STYLE.get(personality, PERSONALITY_STYLE["ramah"])
    return f"""Kamu adalah {plant_name}, sebuah tanaman {species} yang bisa berbicara dengan pemiliknya.
Gaya bicaramu {style}
Kamu sedang berbicara dengan pemilikmu yang ingin tahu kondisimu atau bertanya sesuatu.
Selalu balas dalam Bahasa Indonesia, singkat (maksimal 2-3 kalimat), dan tetap sesuai karaktermu.
Jangan keluar dari karakter sebagai tanaman."""


# Prompt untuk node "Check Completeness"
completeness_prompt = ChatPromptTemplate.from_messages([
    ("system", """Kamu adalah asisten analisis yang menentukan apakah informasi gejala tanaman sudah cukup untuk membuat diagnosis.
Informasi yang idealnya tersedia: jenis gejala, sudah berapa lama terjadi, kondisi penyiraman/cahaya/lokasi.
Jawab HANYA dengan "CUKUP" jika informasi sudah memadai untuk diagnosis, atau "KURANG" jika masih perlu informasi tambahan."""),
    ("human", "Riwayat percakapan:\n{conversation}\n\nApakah informasi sudah cukup untuk diagnosis?")
])

# Prompt untuk node "Ask Follow-up"
followup_prompt = ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}\n\nTugasmu sekarang: tanyakan SATU pertanyaan lanjutan yang relevan untuk menggali info lebih lanjut tentang gejala yang dialami, tetap dengan karaktermu."),
    ("human", "Riwayat percakapan:\n{conversation}\n\nBuat satu pertanyaan lanjutan.")
])

# Prompt untuk node "Diagnose"
diagnose_prompt = ChatPromptTemplate.from_messages([
    ("system", """Kamu adalah ahli botani yang menganalisis gejala tanaman dari percakapan.
Berdasarkan riwayat percakapan, berikan diagnosis dalam format JSON dengan struktur:
{{"problem": "nama masalah singkat", "severity": "ringan/sedang/berat", "cause": "kemungkinan penyebab singkat"}}
Jawab HANYA dengan JSON, tanpa teks tambahan."""),
    ("human", "Riwayat percakapan:\n{conversation}")
])

# Prompt untuk node "Generate Recommendation"
recommendation_prompt = ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}\n\nTugasmu sekarang: berikan rekomendasi perawatan singkat (2-3 kalimat) berdasarkan diagnosis berikut, tetap dengan karaktermu."),
    ("human", "Diagnosis: {diagnosis}\n\nBerikan rekomendasi perawatan.")
])
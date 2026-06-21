import os
import json
from typing import TypedDict, List, Optional
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq

from langchain_core.prompts import ChatPromptTemplate
from app.graph.prompts import (
    build_system_prompt,
    diagnose_prompt,
    recommendation_prompt,
)

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=groq_api_key)

MAX_FOLLOWUPS = 2  # maksimal berapa kali AI boleh tanya balik sebelum dipaksa diagnosis


# ---------- State Definition ----------
class PlantState(TypedDict):
    plant_name: str
    species: str
    personality: str
    messages: List[dict]  # [{"role": "user"/"assistant", "content": "..."}]
    is_complete: bool
    diagnosis: Optional[dict]
    recommendation: Optional[str]
    reply: str  # balasan terbaru untuk dikirim ke user
    followup_count: int  # jumlah pertanyaan follow-up yang sudah diajukan


def format_conversation(messages: List[dict]) -> str:
    lines = []
    for m in messages:
        speaker = "User" if m["role"] == "user" else "Tanaman"
        lines.append(f"{speaker}: {m['content']}")
    return "\n".join(lines)


# Prompt gabungan: sekaligus cek kelengkapan info DAN generate pertanyaan follow-up
# dalam satu kali panggilan LLM (hemat kuota dibanding 2 node terpisah)
combined_followup_prompt = ChatPromptTemplate.from_messages([
    ("system", """{system_prompt}

Tugasmu: analisis riwayat percakapan tentang gejala tanaman ini.
Jika informasi (gejala, durasi, kondisi penyiraman/cahaya/lokasi) sudah CUKUP untuk membuat diagnosis, balas HANYA dengan kata: READY
Jika masih KURANG, ajukan SATU pertanyaan lanjutan singkat (tetap dengan karaktermu) untuk menggali info, balas hanya dengan pertanyaan itu saja tanpa embel-embel lain."""),
    ("human", "Riwayat percakapan:\n{conversation}")
])


# ---------- Node: Check Completeness + Ask Follow-up (gabungan) ----------
def check_and_followup_node(state: PlantState) -> PlantState:
    followup_count = state.get("followup_count", 0)

    # Kalau sudah mencapai batas maksimal follow-up, paksa lanjut ke diagnosis
    if followup_count >= MAX_FOLLOWUPS:
        return {**state, "is_complete": True}

    system_prompt = build_system_prompt(state["plant_name"], state["species"], state["personality"])
    conversation = format_conversation(state["messages"])
    chain = combined_followup_prompt | llm
    result = chain.invoke({"system_prompt": system_prompt, "conversation": conversation})
    content = result.content.strip()

    if content.upper().startswith("READY"):
        return {**state, "is_complete": True}

    # Belum cukup info, simpan pertanyaan follow-up sebagai reply
    new_messages = state["messages"] + [{"role": "assistant", "content": content}]
    return {
        **state,
        "is_complete": False,
        "messages": new_messages,
        "reply": content,
        "followup_count": followup_count + 1,
    }


# ---------- Node: Diagnose ----------
def diagnose_node(state: PlantState) -> PlantState:
    conversation = format_conversation(state["messages"])
    chain = diagnose_prompt | llm
    result = chain.invoke({"conversation": conversation})

    # Bersihkan output dari markdown code block jika ada
    raw = result.content.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").replace("json", "", 1).strip()

    try:
        diagnosis = json.loads(raw)
    except json.JSONDecodeError:
        diagnosis = {"problem": "Tidak dapat dianalisis", "severity": "tidak diketahui", "cause": raw}

    return {**state, "diagnosis": diagnosis}


# ---------- Node: Generate Recommendation ----------
def generate_recommendation_node(state: PlantState) -> PlantState:
    system_prompt = build_system_prompt(state["plant_name"], state["species"], state["personality"])
    chain = recommendation_prompt | llm
    result = chain.invoke({"system_prompt": system_prompt, "diagnosis": json.dumps(state["diagnosis"])})
    new_messages = state["messages"] + [{"role": "assistant", "content": result.content}]
    return {**state, "messages": new_messages, "recommendation": result.content, "reply": result.content}


# ---------- Conditional Edge ----------
def route_after_completeness(state: PlantState) -> str:
    return "diagnose" if state["is_complete"] else "end_turn"


# ---------- Build Graph ----------
def build_plant_graph():
    builder = StateGraph(PlantState)

    builder.add_node("check_and_followup", check_and_followup_node)
    builder.add_node("diagnose", diagnose_node)
    builder.add_node("generate_recommendation", generate_recommendation_node)

    builder.set_entry_point("check_and_followup")

    builder.add_conditional_edges(
        "check_and_followup",
        route_after_completeness,
        {"diagnose": "diagnose", "end_turn": END}
    )

    builder.add_edge("diagnose", "generate_recommendation")
    builder.add_edge("generate_recommendation", END)

    return builder.compile()


plant_graph = build_plant_graph()
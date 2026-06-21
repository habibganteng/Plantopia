import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { getTheme, getAvatar } from "../theme";

const QUICK_QUESTIONS = ["Daun saya menguning", "Tanaman saya layu", "Daunnya berbintik-bintik", "Pertumbuhannya lambat", "Batangnya membusuk"];

export default function ChatPanel({ plant, onDiagnosisComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [lastDiagnosis, setLastDiagnosis] = useState(null);
  const bottomRef = useRef(null);

  const theme = plant ? getTheme(plant.personality) : null;

  useEffect(() => {
    if (!plant) { setMessages([]); setSessionId(null); setIsComplete(false); return; }
    const loadLatestSession = async () => {
      try {
        const res = await api.get(`/chat/latest/${plant.id}`);
        setMessages(res.data.messages || []);
        setSessionId(res.data.session_id);
        setIsComplete(res.data.is_complete);
      } catch (err) {
        console.error("Gagal memuat riwayat sesi:", err);
        setMessages([]); setSessionId(null); setIsComplete(false);
      }
    };
    loadLatestSession();
    setInput("");
    setLastDiagnosis(null);
  }, [plant?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !plant) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/chat/", { plant_id: plant.id, message: text, session_id: isComplete ? null : sessionId });
      setSessionId(res.data.session_id);
      setIsComplete(res.data.is_complete);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
      if (res.data.is_complete) {
        setLastDiagnosis({ diagnosis: res.data.diagnosis, recommendation: res.data.recommendation });
        if (onDiagnosisComplete) onDiagnosisComplete();
      }
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  const exportCard = () => {
    if (!lastDiagnosis || !plant) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 420;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 600, 420);
    gradient.addColorStop(0, "#0B2A22"); gradient.addColorStop(1, "#15493A");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 600, 420);
    ctx.fillStyle = "#E8B95B"; ctx.font = "bold 28px Georgia"; ctx.fillText("Plantopia", 30, 50);
    ctx.fillStyle = "#FAF3E6"; ctx.font = "14px sans-serif"; ctx.fillText("Laporan Diagnosis Tanaman", 30, 75);
    ctx.font = "bold 22px Georgia"; ctx.fillText(`${getAvatar(plant.species)} ${plant.name}`, 30, 130);
    ctx.font = "14px sans-serif"; ctx.fillText(`${plant.species} · ${plant.personality}`, 30, 155);
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(30, 180, 540, 110);
    ctx.fillStyle = "#FAF3E6"; ctx.font = "bold 18px sans-serif";
    ctx.fillText(`Masalah: ${lastDiagnosis.diagnosis?.problem || "-"}`, 45, 210);
    ctx.font = "14px sans-serif"; ctx.fillText(`Tingkat: ${lastDiagnosis.diagnosis?.severity || "-"}`, 45, 235);
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      const words = text.split(" "); let line = ""; let curY = y;
      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth && line !== "") { ctx.fillText(line, x, curY); line = word + " "; curY += lineHeight; }
        else { line = testLine; }
      }
      ctx.fillText(line, x, curY);
    };
    wrapText(`Penyebab: ${lastDiagnosis.diagnosis?.cause || "-"}`, 45, 260, 500, 18);
    ctx.fillStyle = "#E8B95B"; ctx.font = "bold 14px sans-serif"; ctx.fillText("Rekomendasi:", 30, 312);
    ctx.fillStyle = "#FAF3E6"; ctx.font = "13px sans-serif"; wrapText(lastDiagnosis.recommendation || "-", 30, 332, 540, 18);
    ctx.font = "11px sans-serif"; ctx.fillStyle = "rgba(250,243,230,0.5)";
    ctx.fillText(new Date().toLocaleDateString("id-ID"), 30, 400);
    const link = document.createElement("a");
    link.download = `plantopia-${plant.name}-diagnosis.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!plant) {
    return (
      <div className="glass rounded-3xl flex items-center justify-center flex-col gap-3 p-12 min-h-[560px]">
        <div className="text-7xl opacity-60 animate-float">🌿</div>
        <p className="text-cream/50 font-display text-lg">Pilih atau daftarkan tanaman untuk mulai mengobrol</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl flex flex-col min-h-[560px] overflow-hidden">
      {/* Header */}
      <div className={`p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/[0.04] to-transparent`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${theme.aura} opacity-50 blur-xl animate-breathe`}></div>
            <div className={`relative w-14 h-14 rounded-full bg-ink/70 border-2 border-white/20 flex items-center justify-center text-2xl ${theme.glow}`}>
              {getAvatar(plant.species)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold/70 mb-0.5">AI Consultation</div>
            <h2 className="font-display text-xl font-bold text-cream">{plant.name}</h2>
            <p className={`text-xs capitalize ${theme.text}`}>{plant.species} · {plant.personality}</p>
          </div>
        </div>
        {lastDiagnosis && (
          <button onClick={exportCard} className="text-xs bg-gradient-to-r from-gold to-coral text-ink px-4 py-2 rounded-full transition font-semibold shadow-lg hover:scale-105">
            Export Diagnosis
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[320px]">
        {messages.length === 0 && (
          <div className="text-center text-cream/40 mt-10">
            <div className="text-4xl mb-2">{getAvatar(plant.species)}</div>
            <p>Mulai obrolan dengan {plant.name}</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex animate-fadeIn ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${msg.role === "user" ? `${theme.solid} text-ink font-medium` : "bg-white/10 text-cream border border-white/10"}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-cream/50 text-sm">{plant.name} sedang mengetik...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <div className="px-5 py-3 flex gap-2 flex-wrap border-t border-white/10">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => sendMessage(q)} className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${theme.chip} hover:scale-105`}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ketik pesan untuk ${plant.name}...`} disabled={loading}
          className="flex-1 bg-white/10 border border-white/10 text-cream placeholder-cream/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
        <button type="submit" disabled={loading || !input.trim()} className="bg-gradient-to-r from-gold to-coral text-ink px-5 py-2 rounded-full transition disabled:opacity-50 text-sm font-semibold hover:scale-105">
          Kirim
        </button>
      </form>
    </div>
  );
}
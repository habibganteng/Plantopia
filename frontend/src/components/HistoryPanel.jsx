import { useState, useEffect } from "react";
import api from "../api/axios";

export default function HistoryPanel({ plant, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!plant) return;
    setLoading(true);
    try {
      const res = await api.get(`/history/${plant.id}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Gagal mengambil riwayat:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [plant?.id, refreshTrigger]);

  if (!plant) return null;

  const statusColor = (status) => {
    if (status === "sehat") return "bg-emerald-50 text-emerald-700";
    if (status === "perlu perhatian") return "bg-yellow-50 text-yellow-700";
    if (status === "kritis") return "bg-red-50 text-red-700";
    return "bg-gray-50 text-gray-600";
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
      <div className="text-xs font-semibold tracking-wider text-emerald-600 uppercase mb-1">Care Log</div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4">Riwayat Perawatan</h2>

      {loading && <p className="text-sm text-gray-400">Memuat...</p>}
      {!loading && history.length === 0 && <p className="text-sm text-gray-400">Belum ada riwayat perawatan.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.map((item) => {
          const diagnosis = item.diagnosis ? JSON.parse(item.diagnosis) : null;
          return (
            <div key={item.id} className="border border-gray-100 rounded-2xl p-3 text-sm bg-gray-50/50">
              <div className="flex justify-between items-start mb-1">
                <span className="font-serif font-bold text-gray-800">{diagnosis?.problem || "Diagnosis"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(item.health_status)}`}>{item.health_status}</span>
              </div>
              <p className="text-gray-500 text-xs mb-1">{item.symptom_summary}</p>
              <p className="text-gray-300 text-xs">{new Date(item.created_at).toLocaleString("id-ID")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
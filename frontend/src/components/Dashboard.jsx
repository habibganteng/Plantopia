import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Dashboard({ plant, refreshTrigger }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    if (!plant) return;
    setLoading(true);
    try {
      const res = await api.get(`/history/${plant.id}/dashboard`);
      setDashboard(res.data);
    } catch (err) {
      console.error("Gagal mengambil dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [plant?.id, refreshTrigger]);

  if (!plant) {
    return (
      <div className="glass rounded-3xl p-6 flex items-center justify-center min-h-[320px]">
        <p className="text-cream/30 text-sm text-center font-mono">// dashboard akan tampil di sini</p>
      </div>
    );
  }

  const parsedDiagnosis = dashboard?.last_diagnosis ? JSON.parse(dashboard.last_diagnosis) : null;

  return (
    <div className="glass rounded-3xl p-5 h-fit">
      <div className="text-[11px] font-mono uppercase tracking-widest text-gold/80 mb-1">Health Status</div>
      <h2 className="font-display text-2xl font-bold text-cream mb-4">Dashboard</h2>

      {loading && <p className="text-sm text-cream/40">Memuat...</p>}

      {dashboard && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center relative overflow-hidden">
            <div className="text-5xl mb-1 animate-float">{dashboard.mood_emoji}</div>
            <div className="font-display font-bold text-cream text-lg">{dashboard.mood}</div>
            <div className="text-xs text-cream/40 capitalize">{dashboard.health_status}</div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-cream/50 mb-1.5 font-mono">
              <span>SKOR KESEHATAN</span>
              <span>{dashboard.health_score}/100</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all ${dashboard.health_score >= 70 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : dashboard.health_score >= 40 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" : "bg-gradient-to-r from-red-400 to-red-500"}`}
                style={{ width: `${dashboard.health_score}%` }} />
            </div>
          </div>

          {parsedDiagnosis && (
            <div className="border border-gold/20 bg-gold/5 rounded-2xl p-3">
              <div className="text-[10px] text-gold font-mono uppercase tracking-widest mb-1">Diagnosis</div>
              <div className="font-display font-bold text-cream">{parsedDiagnosis.problem}</div>
              <div className="text-xs text-cream/50 mt-1">Tingkat: <span className="capitalize">{parsedDiagnosis.severity}</span></div>
              <div className="text-xs text-cream/40 mt-1">{parsedDiagnosis.cause}</div>
            </div>
          )}

          {dashboard.last_recommendation && (
            <div className="border border-coral/20 bg-coral/5 rounded-2xl p-3">
              <div className="text-[10px] text-coral font-mono uppercase tracking-widest mb-1">Rekomendasi</div>
              <div className="text-sm text-cream/80">{dashboard.last_recommendation}</div>
            </div>
          )}

          {dashboard.last_checked && (
            <div className="text-xs text-cream/25 text-center font-mono">
              {new Date(dashboard.last_checked).toLocaleString("id-ID")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
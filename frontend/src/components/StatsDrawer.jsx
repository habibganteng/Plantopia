import { useState, useEffect } from "react";
import api from "../api/axios";
import { getAvatar, getTheme } from "../theme";

export default function StatsDrawer({ isOpen, onClose }) {
  const [plants, setPlants] = useState([]);
  const [histories, setHistories] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const res = await api.get("/plants/with-status/all");
        setPlants(res.data.plants);
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [isOpen]);

  const toggleExpand = async (plantId) => {
    if (expandedId === plantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(plantId);
    if (!histories[plantId]) {
      try {
        const res = await api.get(`/history/${plantId}`);
        setHistories((prev) => ({ ...prev, [plantId]: res.data }));
      } catch (err) {
        console.error("Gagal memuat riwayat:", err);
        setHistories((prev) => ({ ...prev, [plantId]: [] }));
      }
    }
  };

  const statusColor = (status) => {
    if (status === "sehat") return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
    if (status === "perlu perhatian") return "text-yellow-200 border-yellow-400/30 bg-yellow-500/10";
    if (status === "kritis") return "text-red-300 border-red-400/30 bg-red-500/10";
    return "text-cream/50 border-white/10 bg-white/5";
  };

  const severityColor = (severity) => {
    const s = (severity || "").toLowerCase();
    if (s.includes("ringan")) return "text-emerald-300 bg-emerald-500/10 border-emerald-400/30";
    if (s.includes("sedang")) return "text-yellow-200 bg-yellow-500/10 border-yellow-400/30";
    if (s.includes("berat") || s.includes("parah")) return "text-red-300 bg-red-500/10 border-red-400/30";
    return "text-cream/50 bg-white/5 border-white/10";
  };

  const computeSummary = (history) => {
    const severityCounts = { ringan: 0, sedang: 0, berat: 0 };
    const problemCounts = {};

    history.forEach((item) => {
      const diagnosis = item.diagnosis ? JSON.parse(item.diagnosis) : null;
      if (diagnosis?.severity) {
        const s = diagnosis.severity.toLowerCase();
        if (s.includes("ringan")) severityCounts.ringan++;
        else if (s.includes("sedang")) severityCounts.sedang++;
        else if (s.includes("berat") || s.includes("parah")) severityCounts.berat++;
      }
      if (diagnosis?.problem) {
        problemCounts[diagnosis.problem] = (problemCounts[diagnosis.problem] || 0) + 1;
      }
    });

    const mostCommonProblem = Object.entries(problemCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total: history.length,
      severityCounts,
      mostCommonProblem: mostCommonProblem ? mostCommonProblem[0] : null,
      mostCommonCount: mostCommonProblem ? mostCommonProblem[1] : 0,
    };
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-ink/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      <div className={`fixed top-0 right-0 h-screen w-full max-w-xl glass z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-ink/40 backdrop-blur-md z-10">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-gold/80 mb-1">Identification Records</div>
            <h2 className="font-display text-2xl font-bold text-cream">Statistik Tanaman</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-cream flex items-center justify-center transition text-xl flex-shrink-0">
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading && <p className="text-cream/40 text-center py-10">Memuat data...</p>}

          {!loading && plants.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3 opacity-50">🌱</div>
              <p className="text-cream/40">Belum ada tanaman terdaftar.</p>
            </div>
          )}

          <div className="space-y-3">
            {plants.map((plant) => {
              const theme = getTheme(plant.personality);
              const isExpanded = expandedId === plant.id;
              const history = histories[plant.id] || [];
              const summary = histories[plant.id] ? computeSummary(history) : null;

              return (
                <div key={plant.id} className={`border rounded-2xl overflow-hidden transition-all ${isExpanded ? "border-gold/30 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"}`}>
                  <button onClick={() => toggleExpand(plant.id)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.03] transition">
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 rounded-full ${theme.aura} opacity-40 blur-lg`}></div>
                      <div className="relative w-14 h-14 rounded-full bg-ink/70 border-2 border-white/15 flex items-center justify-center text-2xl">
                        {getAvatar(plant.species)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display text-base font-bold text-cream">{plant.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${statusColor(plant.health_status)}`}>
                          {plant.health_status}
                        </span>
                      </div>
                      <div className="text-xs text-cream/40 font-mono uppercase tracking-wide">
                        {plant.species} · {plant.personality}
                      </div>
                    </div>

                    <div className="text-cream/40 text-lg flex-shrink-0">
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/10 pt-4">

                      {summary && summary.total > 0 && (
                        <div className="mb-5">
                          <div className="text-[10px] font-mono uppercase tracking-widest text-gold/70 mb-2">Ringkasan Statistik</div>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                              <div className="text-2xl font-display font-bold text-cream">{summary.total}</div>
                              <div className="text-[10px] text-cream/40 font-mono uppercase">Total Diagnosis</div>
                            </div>
                            <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                              <div className="text-sm font-display font-bold text-cream truncate">{summary.mostCommonProblem || "-"}</div>
                              <div className="text-[10px] text-cream/40 font-mono uppercase">Masalah Tersering ({summary.mostCommonCount}x)</div>
                            </div>
                          </div>

                          <div className="text-[10px] font-mono uppercase tracking-widest text-cream/40 mb-1.5">Tingkat Urgensi</div>
                          <div className="flex gap-2">
                            <div className="flex-1 bg-emerald-500/10 border border-emerald-400/20 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-emerald-300">{summary.severityCounts.ringan}</div>
                              <div className="text-[9px] text-emerald-300/70 uppercase">Ringan</div>
                            </div>
                            <div className="flex-1 bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-yellow-200">{summary.severityCounts.sedang}</div>
                              <div className="text-[9px] text-yellow-200/70 uppercase">Sedang</div>
                            </div>
                            <div className="flex-1 bg-red-500/10 border border-red-400/20 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-red-300">{summary.severityCounts.berat}</div>
                              <div className="text-[9px] text-red-300/70 uppercase">Berat</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] font-mono uppercase tracking-widest text-gold/70 mb-3">Riwayat Diagnosis</div>

                      {!histories[plant.id] && <p className="text-cream/40 text-sm">Memuat riwayat...</p>}

                      {histories[plant.id] && history.length === 0 && (
                        <p className="text-cream/40 text-sm">Belum ada riwayat diagnosis untuk tanaman ini.</p>
                      )}

                      <div className="space-y-3">
                        {history.map((item) => {
                          const diagnosis = item.diagnosis ? JSON.parse(item.diagnosis) : null;
                          return (
                            <div key={item.id} className="relative pl-5 border-l border-white/10">
                              <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${theme.solid}`}></div>
                              <div className="bg-white/[0.03] rounded-xl p-3">
                                <div className="flex justify-between items-start mb-1.5 flex-wrap gap-1">
                                  <span className="font-display font-bold text-cream text-sm">{diagnosis?.problem || "Diagnosis"}</span>
                                  <div className="flex gap-1">
                                    {diagnosis?.severity && (
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${severityColor(diagnosis.severity)}`}>
                                        ⚡ {diagnosis.severity}
                                      </span>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${statusColor(item.health_status)}`}>
                                      {item.health_status}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-cream/50 text-xs mb-1">{item.symptom_summary}</p>
                                {diagnosis?.cause && <p className="text-cream/35 text-xs italic mb-1">Penyebab: {diagnosis.cause}</p>}
                                {item.recommendation && <p className="text-coral/70 text-xs">💡 {item.recommendation}</p>}
                                <p className="text-cream/25 text-[11px] font-mono mt-1.5">{new Date(item.created_at).toLocaleString("id-ID")}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
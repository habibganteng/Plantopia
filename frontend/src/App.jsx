import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import Dashboard from "./components/Dashboard";
import HistoryPanel from "./components/HistoryPanel";
import StatsDrawer from "./components/StatsDrawer";

function App() {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const handleDiagnosisComplete = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="min-h-screen p-5">
      {/* Navbar - Two Separated Pills */}
      <div className="flex items-center justify-between gap-4 mb-5 max-w-[1400px] mx-auto">
        <div className="glass rounded-3xl px-7 py-4">
          <button onClick={() => setSelectedPlant(null)} className="flex items-center gap-3 group">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold to-coral flex items-center justify-center text-xl shadow-lg group-hover:rotate-6 transition-transform animate-float">🌿</span>
            <div className="text-left">
              <div className="font-display text-xl font-bold text-cream leading-tight tracking-wide">Plantopia</div>
              <div className="text-[11px] text-gold/70 font-mono uppercase tracking-widest leading-tight">AI Plant Companion</div>
            </div>
          </button>
        </div>

        {stats && (
          <button onClick={() => setShowStats(true)} className="glass rounded-3xl px-5 py-4 flex items-center gap-2 hover:bg-white/10 transition flex-wrap">
            <span className="bg-white/10 text-cream px-3.5 py-1.5 rounded-full text-xs font-mono border border-white/10">🌿 {stats.total_plants} Tanaman</span>
            <span className="bg-gold/15 text-gold px-3.5 py-1.5 rounded-full text-xs font-mono border border-gold/20">{stats.average_health_score}/100</span>
            {stats.critical_count > 0 && <span className="bg-red-500/15 text-red-300 px-3.5 py-1.5 rounded-full text-xs font-mono border border-red-400/20 animate-pulse">🔴 {stats.critical_count}</span>}
            {stats.attention_count > 0 && <span className="bg-yellow-500/15 text-yellow-200 px-3.5 py-1.5 rounded-full text-xs font-mono border border-yellow-400/20">🟡 {stats.attention_count}</span>}
            <span className="text-cream/40 text-xs ml-1">▸</span>
          </button>
        )}
      </div>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-5">
        <Sidebar selectedPlant={selectedPlant} onSelectPlant={setSelectedPlant} refreshTrigger={refreshTrigger} onStatsUpdate={setStats} />
        <ChatPanel plant={selectedPlant} onDiagnosisComplete={handleDiagnosisComplete} />
        <Dashboard plant={selectedPlant} refreshTrigger={refreshTrigger} />
      </div>

      {selectedPlant && (
        <div className="max-w-[1400px] mx-auto mt-5">
          <HistoryPanel plant={selectedPlant} refreshTrigger={refreshTrigger} />
        </div>
      )}

      <StatsDrawer isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}

export default App;
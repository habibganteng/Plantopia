import { useState, useEffect } from "react";
import api from "../api/axios";
import { getAvatar, getTheme } from "../theme";

const SPECIES_OPTIONS = ["Kaktus", "Monstera", "Lidah Buaya", "Kuping Gajah", "Sirih Gading", "Pisang", "Mangga", "Jeruk", "Mawar", "Bambu", "Lainnya"];

export default function Sidebar({ selectedPlant, onSelectPlant, refreshTrigger, onStatsUpdate }) {
  const [plants, setPlants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", species: "Kaktus", age: "", location: "indoor" });
  const [loading, setLoading] = useState(false);

  const fetchPlants = async () => {
    try {
      const res = await api.get("/plants/with-status/all");
      setPlants(res.data.plants);
      if (onStatsUpdate) onStatsUpdate(res.data.stats);
    } catch (err) {
      console.error("Gagal mengambil data tanaman:", err);
    }
  };

  useEffect(() => { fetchPlants(); }, [refreshTrigger]);

  const resetForm = () => {
    setFormData({ name: "", species: "Kaktus", age: "", location: "indoor" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const res = await api.put(`/plants/${editingId}`, formData);
        await fetchPlants();
        onSelectPlant(res.data);
      } else {
        const res = await api.post("/plants/", formData);
        await fetchPlants();
        onSelectPlant(res.data);
      }
      resetForm();
    } catch (err) {
      console.error("Gagal menyimpan tanaman:", err);
      alert("Gagal menyimpan tanaman. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plant, e) => {
    e.stopPropagation();
    setEditingId(plant.id);
    setFormData({ name: plant.name, species: plant.species, age: plant.age || "", location: plant.location || "indoor" });
    setShowForm(true);
  };

  const handleDelete = async (plantId, e) => {
    e.stopPropagation();
    if (!confirm("Hapus tanaman ini? Semua riwayat akan ikut terhapus.")) return;
    try {
      await api.delete(`/plants/${plantId}`);
      await fetchPlants();
      if (selectedPlant?.id === plantId) onSelectPlant(null);
    } catch (err) {
      console.error("Gagal menghapus tanaman:", err);
    }
  };

  const statusDot = (status) => {
    if (status === "kritis") return <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-pulse" />;
    if (status === "perlu perhatian") return <span className="w-2 h-2 rounded-full bg-yellow-300 inline-block" />;
    return null;
  };

  return (
    <div className="glass rounded-3xl p-5 flex flex-col h-fit">
      <div className="text-[11px] font-mono uppercase tracking-widest text-gold/80 mb-1">Plant Registry</div>
      <h2 className="font-display text-2xl font-bold text-cream mb-1">Tanaman Saya</h2>
      <p className="text-sm text-cream/50 mb-4">Kelola koleksi hijaumu.</p>

      <div className="space-y-2 mb-4 max-h-[360px] overflow-y-auto pr-1">
        {plants.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-2 opacity-50 animate-float">🌱</div>
            <p className="text-sm text-cream/40">Belum ada tanaman terdaftar.</p>
          </div>
        )}

        {plants.map((plant) => {
          const theme = getTheme(plant.personality);
          const isActive = selectedPlant?.id === plant.id;
          return (
            <div key={plant.id} onClick={() => onSelectPlant(plant)}
              className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${isActive ? "bg-white/12 border-white/20" : "bg-white/[0.03] border-transparent hover:bg-white/[0.07]"}`}>
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-full ${theme.aura} opacity-40 blur-md animate-breathe`}></div>
                <div className="relative w-10 h-10 rounded-full bg-ink/60 border border-white/10 flex items-center justify-center text-lg">
                  {getAvatar(plant.species)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-cream text-sm flex items-center gap-1.5">
                  <span className="truncate">{plant.name}</span>
                  {statusDot(plant.health_status)}
                </div>
                <div className="text-xs text-cream/40 capitalize truncate">{plant.species} · {plant.personality}</div>
              </div>
              <div className="hidden group-hover:flex gap-1 flex-shrink-0">
                <button onClick={(e) => handleEdit(plant, e)} className="text-xs w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 transition">✏️</button>
                <button onClick={(e) => handleDelete(plant.id, e)} className="text-xs w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/30 transition">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full bg-gradient-to-r from-gold to-coral text-ink font-semibold py-2.5 rounded-full transition text-sm shadow-lg hover:shadow-gold/30 hover:scale-[1.02]">
          + Daftarkan Tanaman Baru
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/10">
          <input type="text" placeholder="Nama tanaman" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 rounded-xl bg-white/90 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          <select value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })} className="w-full p-2 rounded-xl bg-white/90 text-ink text-sm">
            {SPECIES_OPTIONS.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
          </select>
          <input type="text" placeholder="Usia (opsional)" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="w-full p-2 rounded-xl bg-white/90 text-ink text-sm" />
          <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 rounded-xl bg-white/90 text-ink text-sm">
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-gold to-coral text-ink font-semibold py-2 rounded-full transition text-sm disabled:opacity-50">
              {loading ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
            </button>
            <button type="button" onClick={resetForm} className="px-3 bg-white/10 hover:bg-white/20 text-cream rounded-full transition text-sm">Batal</button>
          </div>
        </form>
      )}
    </div>
  );
}
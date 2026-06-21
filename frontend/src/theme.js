export const PERSONALITY_THEME = {
  judes: { glow: "shadow-[0_0_40px_rgba(249,115,22,0.45)]", aura: "bg-orange-500", text: "text-orange-300", chip: "bg-orange-500/15 text-orange-200 border-orange-400/30", solid: "bg-orange-500", ring: "ring-orange-400/50" },
  dramatis: { glow: "shadow-[0_0_40px_rgba(168,85,247,0.45)]", aura: "bg-purple-500", text: "text-purple-300", chip: "bg-purple-500/15 text-purple-200 border-purple-400/30", solid: "bg-purple-500", ring: "ring-purple-400/50" },
  kalem: { glow: "shadow-[0_0_40px_rgba(20,184,166,0.45)]", aura: "bg-teal-500", text: "text-teal-300", chip: "bg-teal-500/15 text-teal-200 border-teal-400/30", solid: "bg-teal-500", ring: "ring-teal-400/50" },
  "percaya diri": { glow: "shadow-[0_0_40px_rgba(232,185,91,0.5)]", aura: "bg-gold", text: "text-amber-300", chip: "bg-amber-500/15 text-amber-200 border-amber-400/30", solid: "bg-amber-500", ring: "ring-amber-400/50" },
  ceria: { glow: "shadow-[0_0_40px_rgba(236,72,153,0.45)]", aura: "bg-pink-500", text: "text-pink-300", chip: "bg-pink-500/15 text-pink-200 border-pink-400/30", solid: "bg-pink-500", ring: "ring-pink-400/50" },
  ramah: { glow: "shadow-[0_0_40px_rgba(16,185,129,0.45)]", aura: "bg-emerald-500", text: "text-emerald-300", chip: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30", solid: "bg-emerald-500", ring: "ring-emerald-400/50" },
};

export function getTheme(personality) {
  return PERSONALITY_THEME[personality] || PERSONALITY_THEME["ramah"];
}

export const SPECIES_AVATAR = {
  kaktus: "🌵", monstera: "🪴", "lidah buaya": "🌿", "kuping gajah": "🍃",
  "sirih gading": "🌱", pisang: "🍌", mangga: "🥭", jeruk: "🍊", apel: "🍎",
  bambu: "🎍", mawar: "🌹", bunga: "🌸", melati: "🌼", pohon: "🌳", lainnya: "🌼",
};

export function getAvatar(species) {
  if (!species) return "🌼";
  return SPECIES_AVATAR[species.toLowerCase().trim()] || "🌼";
}
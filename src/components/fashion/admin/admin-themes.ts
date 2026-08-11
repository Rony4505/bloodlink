export type AdminTheme = "rose" | "ocean" | "sage" | "sunset" | "violet" | "gold" | "slate" | "pearl";

export const adminThemes: Record<
  AdminTheme,
  { gradient: string; border: string; accent: string; icon: string }
> = {
  rose: {
    gradient: "bg-[linear-gradient(145deg,#fff5ef,#fde8dc,#f5d0bc)]",
    border: "border-[#e8c4b0]/60",
    accent: "text-[#9b5a42]",
    icon: "✦",
  },
  ocean: {
    gradient: "bg-[linear-gradient(145deg,#eef6ff,#dcecff,#c5ddfb)]",
    border: "border-[#a8c8ef]/60",
    accent: "text-[#3d6a9e]",
    icon: "📦",
  },
  sage: {
    gradient: "bg-[linear-gradient(145deg,#f2f8f2,#e3f0e3,#d0e4d0)]",
    border: "border-[#b5d4b5]/60",
    accent: "text-[#4a7350]",
    icon: "🏷️",
  },
  sunset: {
    gradient: "bg-[linear-gradient(145deg,#fff8f0,#ffe8d6,#ffd4b8)]",
    border: "border-[#f0c49a]/60",
    accent: "text-[#b86a2e]",
    icon: "🚚",
  },
  violet: {
    gradient: "bg-[linear-gradient(145deg,#f8f3ff,#ede0ff,#dcc8ff)]",
    border: "border-[#cbb0ef]/60",
    accent: "text-[#6b4a9e]",
    icon: "🎟️",
  },
  gold: {
    gradient: "bg-[linear-gradient(145deg,#fffbf0,#fff0d4,#f5dfa0)]",
    border: "border-[#e8cc80]/60",
    accent: "text-[#8a6d2b]",
    icon: "⚙️",
  },
  slate: {
    gradient: "bg-[linear-gradient(145deg,#f4f6f8,#e8edf2,#d5dee8)]",
    border: "border-[#b8c8d8]/60",
    accent: "text-[#4a5f73]",
    icon: "📊",
  },
  pearl: {
    gradient: "bg-[linear-gradient(145deg,#fdfcfa,#f5f0ea,#ebe3da)]",
    border: "border-[#d8cfc4]/60",
    accent: "text-[#6b5c50]",
    icon: "📄",
  },
};

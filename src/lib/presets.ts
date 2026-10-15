import type { Style } from "./types";

export const PRESETS: Style[] = [
  { id: "verdant", name: "Verdant", vibe: ["Earthy", "Quiet"], layout: "asymmetrical", fonts: { display: "fraunces", body: "figtree" },
    palette: { bg: "#F4F1E8", surface: "#E6E0CF", ink: "#1F2A1D", muted: "#556050", accent: "#2F6B4F", accentInk: "#FFFFFF" }, space: 1, radius: 10 },
  { id: "editorial", name: "Editorial", vibe: ["Literary", "Refined"], layout: "traditional", fonts: { display: "playfair", body: "source-serif" },
    palette: { bg: "#FAF6EF", surface: "#EFE7D8", ink: "#1B1A17", muted: "#5A5346", accent: "#8C2F1B", accentInk: "#FFFFFF" }, space: 1.05, radius: 2 },
  { id: "coastal", name: "Coastal", vibe: ["Airy", "Calm"], layout: "clean", fonts: { display: "jakarta", body: "jakarta" },
    palette: { bg: "#F3F8FA", surface: "#DFEDF2", ink: "#12303D", muted: "#46626E", accent: "#0E7C9B", accentInk: "#FFFFFF" }, space: 1.25, radius: 14 },
  { id: "brutalist", name: "Brutalist", vibe: ["Raw", "Loud"], layout: "avant-garde", fonts: { display: "space-grotesk", body: "space-grotesk" },
    palette: { bg: "#F2F2EE", surface: "#FFFFFF", ink: "#0A0A0A", muted: "#4A4A4A", accent: "#FF4B1F", accentInk: "#0A0A0A" }, space: 0.9, radius: 0 },
  { id: "midcentury", name: "Midcentury", vibe: ["Warm", "Playful"], layout: "overlapping", fonts: { display: "dm-serif", body: "dm-sans" },
    palette: { bg: "#FBF1DC", surface: "#F1DBAE", ink: "#1F3B3D", muted: "#59503F", accent: "#D98A0B", accentInk: "#1F3B3D" }, space: 1, radius: 22 },
  { id: "noir", name: "Noir", vibe: ["Moody", "Premium"], layout: "symmetrical", fonts: { display: "bebas", body: "inter" },
    palette: { bg: "#101113", surface: "#1B1D21", ink: "#F2EFE8", muted: "#A9A79F", accent: "#E0B65A", accentInk: "#101113" }, space: 1.1, radius: 4 },
];

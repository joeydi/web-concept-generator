import {
  Bebas_Neue, DM_Sans, DM_Serif_Display, Figtree, Fraunces, Hanken_Grotesk, Inter,
  JetBrains_Mono, Playfair_Display, Plus_Jakarta_Sans, Source_Serif_4, Space_Grotesk,
} from "next/font/google";

export const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", weight: ["400", "500", "600", "700"] });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500", "600"] });

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["400", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "700"] });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], variable: "--font-dm-serif", weight: "400" });
const bebas = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: "400" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["400", "500", "700"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700"] });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", weight: ["400", "500", "700"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", weight: ["400", "600"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "700"] });

/** Space-joined class names that define every font CSS variable. */
export const fontClassNames = [
  hanken, jetbrains, fraunces, playfair, dmSerif, bebas, spaceGrotesk, jakarta, figtree, sourceSerif, dmSans, inter,
].map((f) => f.variable).join(" ");

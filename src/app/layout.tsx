import type { Metadata } from "next";
import { fontClassNames } from "@/lib/fontLoaders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web concept generator",
  description: "Generate homepage, landing and details page concepts from any website, then restyle them from an image.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontClassNames}>
      <body>{children}</body>
    </html>
  );
}

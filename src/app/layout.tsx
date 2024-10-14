import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiled Image loader",
  description: "",
  other: {
    "theme-color": "#f1dec2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

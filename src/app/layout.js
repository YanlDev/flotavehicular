import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "SELCOSI — Gestion de Flota",
  description: "Sistema de gestion y control vehicular - SELCOSI EXPORT S.A.C.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}

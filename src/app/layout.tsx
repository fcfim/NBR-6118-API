import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NBR 6118 API - Cálculo Estrutural",
  description:
    "API REST para cálculos de engenharia estrutural conforme NBR 6118:2023. Seções, materiais, cargas e dimensionamento de armadura.",
  keywords: [
    "NBR 6118",
    "concreto armado",
    "engenharia estrutural",
    "API",
    "cálculo estrutural",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

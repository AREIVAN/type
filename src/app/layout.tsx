import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TypeLearn — Practice English Through Typing",
  description: "Improve your English typing skills by transcribing text from PDFs, AI-generated content, or manual input. Learn vocabulary while you practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} h-full bg-zinc-950 text-zinc-100 font-sans`}>
        {children}
      </body>
    </html>
  );
}
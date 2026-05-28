import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Üretim Takip | MiniMax",
  description: "Üretim takip sistemi - Barkod tarama ile üretim süreçlerini takip edin",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}

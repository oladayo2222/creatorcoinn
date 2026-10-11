import type { Metadata } from "next";
import { Unbounded, Urbanist } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { wagmiConfig } from "@/lib/wagmi";
import { Providers } from "./providers";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", weight: ["400", "500", "600", "700"] });
const sans = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "CreatorCoin — Hold the creators you back",
  description:
    "Every creator gets their own coin on BOT Chain. Hold it to unlock private posts and a holders-only room.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get("cookie"));
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        <Providers initialState={initialState}>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

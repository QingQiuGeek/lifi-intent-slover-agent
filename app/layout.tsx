import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Web3Providers } from "@/components/web3-providers";

export const metadata: Metadata = {
  title: "LI.FI Intent Agent",
  description: "Cross-chain swap agent powered by LI.FI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersStore = await headers();
  const cookie = headersStore.get("cookie");

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full overflow-hidden">
        <Web3Providers cookie={cookie}>{children}</Web3Providers>
      </body>
    </html>
  );
}

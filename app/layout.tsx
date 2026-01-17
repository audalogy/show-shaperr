import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryClientProviderWrapper } from "./providers";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TVMaze AI Personalization",
  description: "AI-driven UI personalization for TVMaze data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProviderWrapper>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}

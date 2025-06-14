// app/layout.tsx
import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";

import { ClerkProvider } from "@clerk/nextjs";
import KBar from "@/components/kbar";
import { Toaster } from "sonner"; // ✅ Import Toaster
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Smart Inbox App",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
        <body className="h-full overflow-hidden">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCReactProvider>
              <KBar>{children}</KBar>
            </TRPCReactProvider>
            <Toaster richColors position="bottom-center" /> {/* ✅ Add this line */}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "FocusRPG — Level Up Your Productivity",
  description: "Track your focus, build streaks, earn rewards. A productivity system that keeps you accountable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased bg-grid-pattern min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1 page-enter">{children}</main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#18181b",
                border: "1px solid #27272a",
                color: "#fafafa",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.875rem",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}


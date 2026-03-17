import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { TravelThemeProvider } from "./TravelThemeProvider";

export const metadata: Metadata = {
  title: "YatraSecure — Safe Group Travel",
  description:
    "Plan safe group trips with verified travelers, real-time chat & shared wallet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Space Grotesk — headings | Inter — body | JetBrains Mono — numerics */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ backgroundColor: "var(--bg)" }}>
        <TravelThemeProvider>{children}</TravelThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#131C2E",
              color: "#F1F5F9",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
            success: { iconTheme: { primary: "#22C55E", secondary: "#F1F5F9" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "#F1F5F9" } },
          }}
        />
      </body>
    </html>
  );
}

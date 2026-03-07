import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PermitPulse — Never Miss a License Renewal",
  description: "Track every business license, permit, and certification. Get alerts before expiration. State-specific compliance intelligence for small businesses. $19/mo.",
  openGraph: {
    title: "PermitPulse — Small Business Compliance Tracker",
    description: "Never lose a license, miss a renewal, or face a fine. Know exactly what you need, when it expires, and what happens if you miss it.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

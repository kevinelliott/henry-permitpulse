import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PermitPulse — Never Miss a License Renewal",
  description: "Track business licenses, permits, and certifications. Get alerts before expiration. Compliance intelligence for $15/mo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}

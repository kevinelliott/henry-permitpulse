"use client";
import Link from "next/link";

const DOCS_SECTIONS = [
  {
    title: "How It Works",
    items: [
      {
        title: "The Industry Wizard",
        content: "When you sign up, we'll ask for your business type and your state. PermitPulse uses state-specific compliance intelligence to auto-populate your dashboard with the exact licenses, permits, and certifications required. This isn't just a list; it's a personalized roadmap.",
      },
      {
        title: "Compliance Scoring",
        content: "Your dashboard features a 'Compliance Score.' This is a real-time health check for your business. A score of 100% means everything is current. If a permit expires or enters the warning phase (within 30 days), your score drops immediately, and alerts are sent.",
      },
      {
        title: "Renewal Checklists",
        content: "For every tracked item, we provide a detailed renewal checklist. This includes the required documents, renewal fees, and agency contact info. We even include 'Tips & Gotchas' for tricky permits like ABC liquor licenses or health department renewals.",
      },
    ],
  },
  {
    title: "Employee Certifications",
    items: [
      {
        title: "Two-Sided Tracking",
        content: "PermitPulse is unique because it allows for easy employee certification tracking. You add an employee and generate a public 'Upload Token' for them. They use this link to self-upload their certification (like a food handler card or OSHA cert) without ever having to create an account.",
      },
      {
        title: "Verified vs. Pending",
        content: "When an employee uploads a document, it appears as 'Uploaded' on your dashboard. You can review the document, verify the expiration date, and mark it as 'Verified.' The system will then begin tracking its expiration just like your business permits.",
      },
    ],
  },
  {
    title: "States & Industries",
    items: [
      {
        title: "Currently Supported States",
        content: "PermitPulse currently supports full intelligence for 12 states: California, Texas, Florida, New York, Illinois, Washington, Georgia, Arizona, Colorado, Ohio, Pennsylvania, and North Carolina. More states are added every month.",
      },
      {
        title: "Supported Industries",
        content: "We provide detailed permit templates for: Restaurants, General Contractors, Hair Salons, Retail Stores, Medical Practices, Real Estate Agencies, Auto Repair Shops, and Fitness Studios.",
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-xl text-white">PermitPulse</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm text-slate-400 hover:text-white transition">Sign In</Link>
            <Link href="/auth?signup=1" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-white mb-6">Documentation</h1>
          <p className="text-slate-400 text-xl leading-relaxed">
            Learn how PermitPulse protects your business from government fines and administrative oversight.
          </p>
        </div>

        <div className="space-y-16">
          {DOCS_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-8">
              <h2 className="text-2xl font-black text-white border-b border-slate-800 pb-4">{section.title}</h2>
              <div className="grid gap-8">
                {section.items.map((item) => (
                  <div key={item.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4">{item.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 border-t border-slate-800 pt-12 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white mb-1">Still have questions?</h4>
            <p className="text-slate-400 text-sm">Our support team is ready to help you with state-specific queries.</p>
          </div>
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

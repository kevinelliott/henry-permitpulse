"use client";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "For solopreneurs and early-stage side hustles.",
    features: [
      "Track up to 5 permits",
      "1 employee certification",
      "Email alerts (30-day warning)",
      "Basic compliance dashboard",
      "State-specific intelligence wizard",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "Everything a small business needs to stay compliant.",
    features: [
      "UNLIMITED permits & licenses",
      "Up to 25 employee certifications",
      "Custom renewal checklists",
      "Public compliance badge",
      "Calendar export (iCal / Google)",
      "Multi-channel alerts (SMS + Email)",
      "Priority renewal warnings (90/60/30/7d)",
    ],
    cta: "Start 7-Day Free Trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$39",
    period: "per month",
    description: "For multi-location businesses and teams.",
    features: [
      "Everything in Pro",
      "Multiple business locations",
      "Team access (Unlimited users)",
      "White-labeled verify page",
      "Priority support with expert review",
      "Bulk employee upload portal",
      "API access (Coming soon)",
    ],
    cta: "Scale Your Business",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Why use PermitPulse instead of just a calendar?",
    a: "PermitPulse knows what you need. Our industry-state wizard auto-populates your dashboard with the exact licenses and permits required for your specific business. Plus, we provide renewal checklists, penalty exposure tracking, and a public badge to prove compliance to landlords and insurance companies.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, you can cancel your Pro or Business subscription at any time. Your data remains yours, and you'll keep access until the end of your billing cycle.",
  },
  {
    q: "Do you handle the actual filing for me?",
    a: "Not currently. We provide you with the exact checklists, document lists, and agency links you need to file successfully. We take the guesswork and the 'hunting' out of the process, which saves you 10-15 hours a year and thousands in potential fines.",
  },
  {
    q: "Is my business data secure?",
    a: "Absolutely. We use industry-standard encryption and Supabase's hardened infrastructure. Your sensitive business documents and employee data are protected by bank-level security protocols.",
  },
];

export default function PricingPage() {
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

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-white mb-6">Simple Pricing for Peace of Mind</h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            Missed renewals cost small businesses $3B+ in fines every year. PermitPulse is your insurance policy against government paperwork.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 border flex flex-col relative ${
                plan.highlight
                  ? "bg-emerald-900/20 border-emerald-500 shadow-2xl shadow-emerald-900/20 ring-4 ring-emerald-500/10"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-black text-white">{plan.price}</span>
                {plan.period && <span className="text-slate-500 text-sm">{plan.period}</span>}
              </div>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">{plan.description}</p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-emerald-500 shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/auth?signup=1"
                className={`w-full py-4 rounded-xl text-center font-bold text-lg transition ${
                  plan.highlight
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center bg-slate-900 border border-slate-800 rounded-3xl p-12">
          <h2 className="text-3xl font-black text-white mb-4">Protect Your Business Today</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Join thousands of small business owners who never worry about missed permits again.
          </p>
          <Link href="/auth?signup=1" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition shadow-lg">
            Start Your Free Dashboard Free →
          </Link>
        </div>
      </div>
    </div>
  );
}

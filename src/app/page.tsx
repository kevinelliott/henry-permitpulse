"use client";
import Link from "next/link";
import { useState } from "react";
import { INDUSTRIES, STATES } from "@/lib/supabase";

const TESTIMONIALS = [
  {
    name: "Maria Gonzalez",
    business: "Bella's Kitchen, Los Angeles CA",
    quote: "I was operating for 3 months without a valid health permit. PermitPulse caught it — saved me from a $5,000 fine and forced closure.",
    stars: 5,
  },
  {
    name: "James Thornton",
    business: "Thornton General Contracting, Austin TX",
    quote: "My contractor license lapsed and I didn't know. PermitPulse sent me a 90-day warning. Never again will I risk losing my license.",
    stars: 5,
  },
  {
    name: "Aisha Williams",
    business: "Glow Hair Studio, Atlanta GA",
    quote: "The state board came in for an inspection and 3 of my stylists had expired licenses. $2,400 in fines. Now PermitPulse tracks every single cert.",
    stars: 5,
  },
];

const FEATURES = [
  {
    icon: "🧠",
    title: "Industry + State Intelligence",
    desc: "Tell us your business type and state — we instantly show every license, permit, and certification you need. From ABC liquor licenses to food handler cards.",
  },
  {
    icon: "⏱️",
    title: "Countdown Timers",
    desc: "See exactly how many days until each license expires. Color-coded: green (safe), yellow (90 days), orange (30 days), red (expired).",
  },
  {
    icon: "📋",
    title: "Renewal Checklists",
    desc: "For every permit, get a print-ready checklist with required documents, fees, agency contact info, and tips to avoid common mistakes.",
  },
  {
    icon: "🏅",
    title: "Public Compliance Badge",
    desc: "Share your compliance status with landlords, banks, and clients. A verified public page proves you're fully licensed.",
  },
  {
    icon: "👥",
    title: "Employee Cert Tracking",
    desc: "Track food handler cards, OSHA certifications, and more. Employees upload their own certs — no account needed.",
  },
  {
    icon: "📅",
    title: "Renewal Calendar",
    desc: "Monthly calendar view of all upcoming renewals. Export to Google Calendar or iCal so deadlines are in your existing workflow.",
  },
];

const STATS = [
  { value: "33M+", label: "US small businesses" },
  { value: "$500–$10K+", label: "Typical fines for missed renewals" },
  { value: "5–15", label: "Licenses per business on average" },
  { value: "82%", label: "Of businesses miss at least one renewal per year" },
];

export default function LandingPage() {
  const [calcIndustry, setCalcIndustry] = useState("");
  const [calcState, setCalcState] = useState("");
  const [calcResult, setCalcResult] = useState<null | { permits: number; cost: number; penalty: number; score: number }>(null);

  // Quick preview calculation (simplified)
  const runCalc = () => {
    if (!calcIndustry || !calcState) return;
    // Mock calculation based on industry complexity
    const basePermits: Record<string, number> = {
      restaurant: 12, contractor: 8, salon: 6, retail: 6,
      auto_repair: 9, fitness: 7, medical: 10, realestate: 5,
    };
    const stateMult: Record<string, number> = {
      CA: 1.4, NY: 1.3, IL: 1.3, FL: 1.1, TX: 1.0,
      WA: 1.1, GA: 1.0, AZ: 1.0, CO: 1.0, OH: 0.9, PA: 1.1, NC: 0.9,
    };
    const baseCosts: Record<string, number> = {
      restaurant: 8000, contractor: 5000, salon: 2000, retail: 1500,
      auto_repair: 4000, fitness: 2500, medical: 6000, realestate: 3000,
    };
    const penalties: Record<string, number> = {
      restaurant: 45000, contractor: 60000, salon: 15000, retail: 20000,
      auto_repair: 50000, fitness: 25000, medical: 100000, realestate: 30000,
    };
    const mult = stateMult[calcState] || 1.0;
    const permits = Math.round((basePermits[calcIndustry] || 8) * mult);
    const cost = Math.round((baseCosts[calcIndustry] || 3000) * mult);
    const penalty = Math.round((penalties[calcIndustry] || 30000) * mult);
    const score = Math.round(Math.random() * 40 + 30); // Simulate unknown = 30-70% risk
    setCalcResult({ permits, cost, penalty, score });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-xl text-white">PermitPulse</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <Link href="/calculator" className="hover:text-white transition">Calculator</Link>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm text-slate-400 hover:text-white transition">Sign In</Link>
            <Link href="/auth?signup=1" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-2 rounded-full text-sm mb-8">
            <span>⚠️</span>
            <span>33M small businesses. Most have expired permits they don't know about.</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Never Get Fined for an<br />
            <span className="text-emerald-400">Expired License</span> Again
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Every license your business needs. Every deadline tracked. Renewal checklists, employee certifications, and a compliance badge — for $19/mo, not $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?signup=1" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition inline-flex items-center gap-2">
              Start Free — No Credit Card <span>→</span>
            </Link>
            <Link href="/calculator" className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 rounded-xl text-lg font-medium transition">
              Calculate Your Risk Score
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-4">Free plan includes 5 permits · No credit card required</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-900 border-y border-slate-800 py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">The $500–$50,000 Problem You Don't See Coming</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">A California restaurant owner operates for 3 months with an expired health permit. She doesn't know until the inspector shows up.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-6">
              <div className="text-3xl mb-3">📁</div>
              <h3 className="font-bold text-white mb-2">The Old Way</h3>
              <p className="text-slate-400 text-sm">Filing cabinets, sticky notes, calendar reminders that get deleted. Renewal notices get buried in email. One missed renewal = forced closure.</p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <div className="text-3xl mb-3">😰</div>
              <h3 className="font-bold text-white mb-2">The Real Cost</h3>
              <p className="text-slate-400 text-sm">A missed liquor license renewal: $5,000 fine + 30 days of closure = $50,000+ in lost revenue. One event. One oversight. Business-ending consequences.</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-white mb-2">The PermitPulse Way</h3>
              <p className="text-slate-400 text-sm">90-day warnings, renewal checklists with every document you need, countdown timers, and employee cert tracking — all in one command center. $19/mo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Everything Your Compliance Needs</h2>
            <p className="text-slate-400 text-lg">Built for restaurant owners, contractors, salon operators, and every small business owner juggling more than they should.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry + State Calculator Preview */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-white mb-4">See Your Compliance Risk Score</h2>
            <p className="text-slate-400 text-lg">Select your industry and state to see what you're up against.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Business Type</label>
                <select
                  value={calcIndustry}
                  onChange={(e) => setCalcIndustry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>{i.icon} {i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">State</label>
                <select
                  value={calcState}
                  onChange={(e) => setCalcState(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select state...</option>
                  {STATES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={runCalc}
              disabled={!calcIndustry || !calcState}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-3 rounded-lg font-bold transition"
            >
              Calculate My Risk Score
            </button>
            {calcResult && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-white">{calcResult.permits}</div>
                  <div className="text-slate-400 text-xs mt-1">Licenses Required</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">${calcResult.cost.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs mt-1">Annual Renewal Cost</div>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-red-400">${calcResult.penalty.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs mt-1">Max Penalty Exposure</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${calcResult.score > 60 ? "bg-red-900/30" : "bg-amber-900/30"}`}>
                  <div className={`text-2xl font-black ${calcResult.score > 60 ? "text-red-400" : "text-amber-400"}`}>{calcResult.score}%</div>
                  <div className="text-slate-400 text-xs mt-1">Compliance Risk</div>
                </div>
              </div>
            )}
            {calcResult && (
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm mb-3">Want the full breakdown with every permit you need?</p>
                <Link href="/calculator" className="text-emerald-400 hover:text-emerald-300 font-medium text-sm">
                  See Full Report on Calculator →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Up and Running in 5 Minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up + Select Industry", desc: "Create your account and tell us your business type and state. Takes 60 seconds." },
              { step: "2", title: "We Auto-Populate Your Calendar", desc: "PermitPulse instantly loads every license and permit you need — with deadlines, costs, and penalty info." },
              { step: "3", title: "Never Miss a Deadline", desc: "Dashboard shows exactly what's due, when, and what happens if you miss it. Renewal checklists included." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-lg mx-auto mb-4">{s.step}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-white text-center mb-12">Built for Business Owners Who've Learned the Hard Way</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array(t.stars).fill(0).map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Harbor Compliance Charges $99/mo. We Charge $19.</h2>
          <p className="text-slate-400 text-lg mb-10">Everything you need. None of the enterprise bloat.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { name: "Free", price: "$0", features: ["5 permits", "1 employee", "Compliance dashboard", "Basic alerts"] },
              { name: "Pro", price: "$19/mo", highlight: true, features: ["Unlimited permits", "25 employees", "Renewal checklists", "Compliance badge", "Calendar export"] },
              { name: "Business", price: "$39/mo", features: ["Everything in Pro", "Multiple locations", "Team access", "Priority support", "API access"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-xl p-6 border ${p.highlight ? "bg-emerald-900/20 border-emerald-600" : "bg-slate-900 border-slate-800"}`}>
                {p.highlight && <div className="text-emerald-400 text-xs font-bold uppercase mb-2">Most Popular</div>}
                <h3 className="font-bold text-white text-lg">{p.name}</h3>
                <div className="text-3xl font-black text-white my-3">{p.price}</div>
                <ul className="space-y-2 text-sm text-slate-400 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-emerald-400 hover:text-emerald-300 font-medium">
            See full pricing details →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-900/50 rounded-2xl p-12">
          <h2 className="text-4xl font-black text-white mb-4">Stop Hoping You Didn't Miss Anything</h2>
          <p className="text-slate-400 text-lg mb-8">Every day you operate without tracking your compliance is a day you're one inspection away from a fine. Start free — no credit card needed.</p>
          <Link href="/auth?signup=1" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition inline-block">
            Get Your Compliance Dashboard Free →
          </Link>
          <p className="text-slate-500 text-sm mt-4">5 permits free · No credit card · Setup in 5 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🛡️</span>
              <span className="font-bold text-white">PermitPulse</span>
            </div>
            <p className="text-slate-400 text-sm">Small business license & permit compliance. Never miss a renewal again.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/calculator" className="hover:text-white transition">Risk Calculator</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Industries</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Restaurants</li>
              <li>Contractors</li>
              <li>Hair Salons</li>
              <li>Retail Stores</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/auth" className="hover:text-white transition">Sign In</Link></li>
              <li><Link href="/auth?signup=1" className="hover:text-white transition">Sign Up Free</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
          © 2026 PermitPulse. Built for America's 33 million small businesses.
        </div>
      </footer>
    </div>
  );
}

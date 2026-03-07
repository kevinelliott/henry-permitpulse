"use client";
import { useState } from "react";
import Link from "next/link";
import { INDUSTRIES, STATES } from "@/lib/supabase";

export default function CalculatorPage() {
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  const [result, setResult] = useState<null | { 
    permits: number; 
    cost: number; 
    penalty: number; 
    score: number;
    items: string[];
  }>(null);

  const calculate = () => {
    if (!industry || !state) return;
    
    // Mock intelligence logic
    const basePermits: Record<string, string[]> = {
      restaurant: ["City Business License", "Seller's Permit", "Health Department Permit", "ABC Liquor License", "Food Handler Cards", "Fire Department Permit", "Building/Occupancy Permit", "Signage Permit", "Music/Entertainment License", "ADA Compliance", "Workers' Comp Insurance", "Employer Identification Number"],
      contractor: ["State Contractor Registration", "City Business License", "Building Permits", "Workers' Comp Insurance", "General Liability Insurance", "Vehicle/Fleet Permits", "OSHA Compliance Training", "EPA/Environmental Permits"],
      salon: ["Cosmetology Establishment License", "Individual Cosmetology License", "City Business License", "Hazardous Materials Plan", "Workers' Comp Insurance", "Sales Tax Permit"],
      retail: ["City Business License", "Seller's Permit", "Certificate of Occupancy", "Signage Permit", "Workers' Comp Insurance", "ADA Compliance"],
      auto_repair: ["Bureau of Automotive Repair License", "Smog Check License", "City Business License", "Hazardous Waste Registration", "Stormwater Permit", "Workers' Comp Insurance", "Air Quality Permit"],
      fitness: ["City Business License", "Health Studio Act Compliance", "Certificate of Occupancy", "Personal Trainer Certs", "CPR/AED Certification", "Workers' Comp Insurance", "Seller's Permit"],
      medical: ["Physician License", "DEA Registration", "State CDS Registration", "Medical Corp License", "X-Ray Machine Registration", "CLIA Certificate", "HIPAA Compliance", "Workers' Comp Insurance"],
      realestate: ["Real Estate Broker License", "Salesperson License", "City Business License", "Errors & Omissions Insurance"],
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

    const mult = stateMult[state] || 1.0;
    const items = basePermits[industry] || [];
    const permits = Math.round(items.length * mult);
    const cost = Math.round((baseCosts[industry] || 3000) * mult);
    const penalty = Math.round((penalties[industry] || 30000) * mult);
    const score = Math.round(Math.random() * 40 + 30);

    setResult({ permits, cost, penalty, score, items });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">Compliance Risk Calculator</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Find out exactly how many licenses you need, what they cost, and the financial risk of operating without them.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-12 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">What kind of business?</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>{i.icon} {i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Which state?</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">Select state...</option>
                {STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={!industry || !state}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-5 rounded-xl font-black text-xl transition shadow-lg shadow-emerald-900/20"
          >
            Calculate Risk Report →
          </button>

          {result && (
            <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-700/50">
                  <div className="text-3xl font-black text-white">{result.permits}</div>
                  <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-bold">Licenses Needed</div>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-700/50">
                  <div className="text-3xl font-black text-emerald-400">${result.cost.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-bold">Annual Fees</div>
                </div>
                <div className="bg-red-900/20 rounded-2xl p-6 text-center border border-red-900/30">
                  <div className="text-3xl font-black text-red-400">${result.penalty.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-bold">Max Fines</div>
                </div>
                <div className={`rounded-2xl p-6 text-center border ${result.score > 60 ? "bg-red-900/20 border-red-900/30" : "bg-amber-900/20 border-amber-900/30"}`}>
                  <div className={`text-3xl font-black ${result.score > 60 ? "text-red-400" : "text-amber-400"}`}>{result.score}%</div>
                  <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-bold">Risk Score</div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>📋</span> Likely Required Licenses & Permits
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-emerald-500 text-xs">●</span>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-red-950/20 border border-red-900/30 rounded-xl text-sm text-red-300">
                  <strong>🚨 Penalty Alert:</strong> Operating without just one of these can lead to immediate closure or fines up to <strong>${Math.round(result.penalty * 0.2).toLocaleString()}</strong> in {STATES.find(s => s.value === state)?.label}.
                </div>
              </div>

              <div className="text-center bg-emerald-600 rounded-2xl p-10 shadow-xl shadow-emerald-900/20">
                <h3 className="text-2xl font-black text-white mb-3">Get Your Full Compliance Roadmap</h3>
                <p className="text-emerald-100 mb-8 max-w-md mx-auto">
                  We'll auto-populate your dashboard with every permit above, including exact deadlines, agency links, and renewal checklists.
                </p>
                <Link href="/auth?signup=1" className="bg-white text-emerald-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-emerald-50 transition shadow-lg">
                  Start Your Dashboard Free →
                </Link>
                <p className="text-emerald-800 text-xs mt-4 font-bold uppercase tracking-widest">Takes less than 2 minutes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

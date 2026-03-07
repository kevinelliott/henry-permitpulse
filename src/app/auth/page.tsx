"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(searchParams.get("signup") === "1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/dashboard");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = getSupabase();

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account created! Check your email to verify, or sign in directly.");
        setTimeout(() => router.push("/onboarding"), 1500);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-xl text-white">PermitPulse</span>
          </Link>
          <h1 className="text-2xl font-black text-white">{isSignup ? "Start Tracking Compliance" : "Welcome Back"}</h1>
          <p className="text-slate-400 mt-2">{isSignup ? "Free account · No credit card needed" : "Sign in to your dashboard"}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                placeholder="you@business.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                placeholder={isSignup ? "Min. 8 characters" : "Your password"}
              />
            </div>
            {error && <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-lg text-sm">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition"
            >
              {loading ? "..." : isSignup ? "Create Free Account →" : "Sign In →"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isSignup ? (
              <>Already have an account? <button onClick={() => setIsSignup(false)} className="text-emerald-400 hover:text-emerald-300">Sign in</button></>
            ) : (
              <>Don&apos;t have an account? <button onClick={() => setIsSignup(true)} className="text-emerald-400 hover:text-emerald-300">Sign up free</button></>
            )}
          </div>
        </div>

        {isSignup && (
          <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-300 mb-2">What you get free:</p>
            <ul className="space-y-1">
              <li>✓ Track 5 permits with expiry dates</li>
              <li>✓ Compliance dashboard with countdown timers</li>
              <li>✓ Industry + state permit wizard</li>
              <li>✓ 1 employee certification</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

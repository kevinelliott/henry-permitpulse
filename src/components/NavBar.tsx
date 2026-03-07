"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/permits", label: "Permits", icon: "📋" },
  { href: "/employees", label: "Employees", icon: "👥" },
  { href: "/renewals", label: "Renewals", icon: "📅" },
];

export default function NavBar({ businessName }: { businessName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-white hidden sm:block">PermitPulse</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  pathname === item.href
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {businessName && (
            <span className="text-slate-400 text-sm hidden md:block">{businessName}</span>
          )}
          <Link href="/pricing" className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full hover:bg-emerald-900/60 transition">
            Upgrade
          </Link>
          <button onClick={handleSignOut} className="text-slate-500 hover:text-slate-300 text-sm transition">
            Sign out
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-800 flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-2 text-center text-xs font-medium transition ${
              pathname === item.href ? "text-white bg-slate-800" : "text-slate-400"
            }`}
          >
            <span className="block text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

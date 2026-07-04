"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Connexion impossible");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080808" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image src="/brand/logo-icon.png" alt="Logo PERF'EXHAUST" width={52} height={36} className="h-9 w-auto" />
          <div>
            <div className="text-white font-black text-lg leading-none" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              PERF&apos;EXHAUST
            </div>
            <div className="text-brand-500 text-xs font-bold tracking-widest uppercase">Administration</div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="p-6 sm:p-8 border space-y-5"
          style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}
        >
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="admin@perfexhaust.fr"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5" role="alert">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold tracking-widest uppercase text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Connexion...</> : <><Lock size={14} /> Se connecter</>}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">Accès réservé à l&apos;atelier PERF&apos;EXHAUST.</p>
      </div>
    </div>
  );
}

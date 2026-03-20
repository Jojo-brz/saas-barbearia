/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ShieldCheck, Mail, Lock } from "lucide-react";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading("Autenticando...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login-super`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("superadmin_token", data.access_token);
        toast.success("Bem-vindo, CEO!", { id: tid });
        router.push("/superadmin");
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (err) {
      toast.error("Acesso negado.", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-500/10 p-4 rounded-full mb-4">
            <ShieldCheck size={40} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">SuperAdmin</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Acesso restrito à gestão do SaaS
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input
              required
              type="email"
              placeholder="admin@saas.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-zinc-500" size={20} />
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-amber-500 text-black font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-all shadow-lg active:scale-95 mt-2"
          >
            {loading ? "Verificando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </main>
  );
}

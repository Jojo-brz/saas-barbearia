"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Logo } from "../../src/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await fetch("http://127.0.0.1:8000/token", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("barber_token", data.access_token);
        localStorage.setItem("barber_slug", data.slug);
        localStorage.setItem("barber_role", data.role);
        toast.success("Login realizado com sucesso!");
        setTimeout(() => {
          if (data.role === "admin") router.push("/super-admin");
          else router.push(`/admin/${data.slug}`);
        }, 1000);
      } else {
        toast.error("E-mail ou senha incorretos.");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl w-full max-w-sm border border-zinc-200">
        <div className="flex justify-center mb-8">
          <Logo className="w-40 h-auto" color="#18181b" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1 tracking-wider">
              E-mail
            </label>
            <input
              required
              type="email"
              className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-zinc-900 focus:border-zinc-900 focus:bg-white outline-none transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1 tracking-wider">
              Senha
            </label>
            <input
              required
              type="password"
              className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-zinc-900 focus:border-zinc-900 focus:bg-white outline-none transition-all font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl hover:bg-black transition-transform active:scale-95 uppercase tracking-wide text-xs shadow-lg mt-4"
          >
            {loading ? "Entrando..." : "Acessar Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}

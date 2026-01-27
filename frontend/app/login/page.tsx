"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

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

        toast.success("Login realizado com sucesso! 🔓"); // <--- TOAST SUCESSO

        // Pequeno delay para o usuário ler a mensagem antes de redirecionar
        setTimeout(() => {
          if (data.role === "admin") router.push("/super-admin");
          else router.push(`/admin/${data.slug}`);
        }, 1000);
      } else {
        toast.error("E-mail ou senha incorretos."); // <--- TOAST ERRO
      }
    } catch {
      toast.error("Erro ao conectar com o servidor."); // <--- TOAST ERRO
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (Mantenha o resto do JSX igual, o return não muda)
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200">
        <h1 className="text-2xl font-black text-center mb-6 text-zinc-900 uppercase tracking-tight">
          Acesso ao Painel 🔐
        </h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
              E-mail
            </label>
            <input
              required
              type="email"
              className="w-full border border-zinc-300 p-3 rounded text-black focus:border-black outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
              Senha
            </label>
            <input
              required
              type="password"
              className="w-full border border-zinc-300 p-3 rounded text-black focus:border-black outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-bold py-3 rounded hover:bg-black transition-colors uppercase tracking-wide text-sm"
          >
            {loading ? "Entrando..." : "Acessar Painel"}
          </button>
        </form>
        <p className="text-center mt-8 text-xs text-zinc-400 font-medium">
          <Link href="/" className="hover:text-black transition-colors">
            ← Voltar para Início
          </Link>
        </p>
      </div>
    </div>
  );
}

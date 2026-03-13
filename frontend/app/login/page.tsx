"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Scissors, Eye } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // LOGIN NORMAL (Conecta no seu backend FastAPI)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      // 1. Mudamos a URL para a rota que existe no seu main.py
      // 2. Mudamos para JSON, que é o que seu backend espera
      const res = await fetch(`${API_URL}/auth/login-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email, // Certifique-se que o nome da variável aqui é email
          password: password, // Certifique-se que o nome da variável aqui é password
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Salva os dados para usar depois
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("slug", data.slug);

        // Redireciona baseado no cargo (Role) que definimos no main.py
        if (data.user.role === "SUPER_ADMIN") {
          window.location.href = "/super-admin";
        } else {
          window.location.href = `/admin/${data.slug}`;
        }
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Falha no login");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro de conexão com o servidor.");
    }
  };

  // LOGIN DE DEMONSTRAÇÃO (Faz login REAL no backend usando a conta de teste)
  const executarLoginDemonstracao = async () => {
    setEmail("demo@barbearia.com");
    setPassword("123456");
    setLoading(true);

    const formData = new FormData();
    formData.append("username", "demo@barbearia.com");
    formData.append("password", "123456");

    try {
      const res = await fetch(`${API_URL}/token`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("slug", data.slug);

        if (data.user.role === "SUPER_ADMIN") {
          router.push("/super-admin");
        } else {
          router.push(`/admin/${data.slug}`);
        }

        toast.success("Acesso de demonstração liberado!", {
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
          },
        });

        setTimeout(() => {
          router.push(`/admin/${data.slug}`);
        }, 1500);
      } else {
        toast.error("Crie a conta demo@barbearia.com no Super Admin primeiro!");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 md:p-6 overflow-hidden relative">
      {/* Luz de Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 md:w-150 md:h-150 bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md z-10">
        {/* Neon na borda */}
        <div className="absolute -inset-0.5 bg-linear-to-r from-cyan-500 to-blue-600 rounded-4xl blur opacity-40 animate-pulse"></div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-zinc-950 w-full rounded-3xl p-8 md:p-10 relative border border-white/5 shadow-2xl"
        >
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-inner">
              <Scissors className="w-6 h-6 text-cyan-500" />
            </div>
            <h1 className="text-3xl text-white tracking-[0.15em] flex items-center">
              <span className="font-extrabold">BARBER</span>
              <span className="text-cyan-500 font-light">SAAS</span>
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2 tracking-widest">
                E-mail de acesso
              </label>
              <input
                required
                type="email"
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-white placeholder-zinc-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:bg-zinc-900 outline-none transition-all font-medium"
                value={email}
                placeholder="barbearia@email.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2 tracking-widest">
                Senha
              </label>
              <input
                required
                type="password"
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-white placeholder-zinc-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:bg-zinc-900 outline-none transition-all font-medium"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-4 rounded-2xl hover:bg-cyan-500 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 mt-8 shadow-lg shadow-cyan-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Acessar Meu Painel</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* === BOTÃO DE ACESSO RÁPIDO PARA PORTFÓLIO / CLIENTES === */}
          <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
            <p className="text-xs text-zinc-500 mb-4 font-medium uppercase tracking-wider">
              Apenas testando o sistema?
            </p>
            <button
              type="button"
              onClick={executarLoginDemonstracao}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-300 font-bold py-3.5 rounded-2xl hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800 disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-cyan-500" />
              Entrar na Versão Demonstrativa
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

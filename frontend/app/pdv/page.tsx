/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Scissors, KeySquare, Store } from "lucide-react";

export default function LoginBarbeiro() {
  const router = useRouter();

  // Se o tablet já estiver configurado para uma barbearia, ele lembra a URL (slug)
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSlug = localStorage.getItem("pdv_slug");
    if (savedSlug) setSlug(savedSlug);
  }, []);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading("Verificando PIN...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: slug.toLowerCase(), pin }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        // Guarda a chave do Barbeiro
        localStorage.setItem("saas_token", data.access_token);
        localStorage.setItem("saas_user", JSON.stringify(data.user));
        localStorage.setItem("pdv_slug", slug); // Lembra o tablet para o próximo

        toast.success(`Olá, ${data.user.name}!`, { id: tid });
        router.push("/admin/agenda"); // Manda o barbeiro direto pra agenda dele
      } else {
        toast.error("PIN ou Barbearia inválidos", { id: tid });
        setPin(""); // Limpa o PIN para tentar de novo
      }
    } catch (err) {
      toast.error("Erro na conexão", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[36px] w-full max-w-sm shadow-2xl relative overflow-hidden">
        {/* Detalhe visual de barbearia no topo */}
        <div className="absolute top-0 left-0 right-0 h-3 flex">
          <div className="flex-1 bg-red-500"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-blue-600"></div>
        </div>

        <div className="flex flex-col items-center mt-6 mb-8">
          <div className="bg-zinc-100 p-4 rounded-full mb-4">
            <Scissors size={32} className="text-zinc-800" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 uppercase italic tracking-wider">
            Acesso Rápido
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium text-center">
            Insira o seu PIN para ver a agenda
          </p>
        </div>

        <form onSubmit={handlePinLogin} className="space-y-4">
          <div className="relative">
            <Store className="absolute left-4 top-4 text-zinc-400" size={20} />
            <input
              required
              type="text"
              placeholder="URL da Barbearia"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 ring-black font-medium"
            />
          </div>
          <div className="relative">
            <KeySquare
              className="absolute left-4 top-4 text-zinc-400"
              size={20}
            />
            <input
              required
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Seu PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 ring-black font-bold tracking-widest text-center text-xl"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-95 mt-4 text-lg"
          >
            {loading ? "A abrir..." : "Entrar"}
          </button>
        </form>

        <button
          onClick={() => router.push("/login")}
          className="w-full mt-6 text-sm font-bold text-zinc-400 hover:text-black transition-colors"
        >
          Entrar como Gerente
        </button>
      </div>
    </main>
  );
}

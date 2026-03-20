/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Scissors,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopData, setShopData] = useState<{
    shop_id: number;
    shop_name: string;
  } | null>(null);
  const [pin, setPin] = useState("");

  // NOVO: Verifica se já existe uma loja conectada ao abrir a página
  useEffect(() => {
    const savedShop = localStorage.getItem("connected_shop");
    if (savedShop) {
      setShopData(JSON.parse(savedShop));
      setStep(2); // Pula direto para a tela do PIN
    }
  }, []);

  const handleVerifyShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-shop`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!res.ok) throw new Error("Credenciais da loja inválidas");

      const data = await res.json();

      // SALVA A LOJA: Para não precisar logar com e-mail de novo
      localStorage.setItem("connected_shop", JSON.stringify(data));

      setShopData(data);
      setStep(2);
      toast.success(`Barbearia ${data.shop_name} conectada!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 2: ENTRAR COM O PIN DO FUNCIONÁRIO
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopData) return;
    if (pin.length < 4) return toast.error("O PIN deve ter 4 dígitos");

    setLoading(true);
    const tid = toast.loading("Verificando acesso...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop_id: shopData.shop_id, pin }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "PIN incorreto");
      }

      const data = await res.json();

      // Salva o token do funcionário e os dados dele
      localStorage.setItem("saas_token", data.access_token);
      localStorage.setItem("saas_user", JSON.stringify(data.user));

      toast.success(`Bem-vindo(a), ${data.user.name}!`, { id: tid });
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      setPin(""); // Limpa o PIN para ele tentar de novo
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-6 selection:bg-amber-500 selection:text-black">
      {/* Logotipo Animado */}
      <div className="mb-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-amber-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4">
          <Scissors size={32} className="text-black" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase">
          Barber<span className="text-amber-500">SaaS</span>
        </h1>
      </div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-4xl p-8 shadow-2xl relative overflow-hidden">
        {/* ================= ETAPA 1: LOGIN DA BARBEARIA ================= */}
        {step === 1 && (
          <form
            onSubmit={handleVerifyShop}
            className="animate-in slide-in-from-left duration-300"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">
                Acesso do Estabelecimento
              </h2>
              <p className="text-zinc-500 text-sm">
                Conecte o sistema à sua barbearia
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  E-mail da Barbearia
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder="contato@barbearia.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Senha
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              Continuar <ArrowRight size={20} />
            </button>
          </form>
        )}

        {/* ================= ETAPA 2: PIN DO FUNCIONÁRIO ================= */}
        {step === 2 && shopData && (
          <form
            onSubmit={handlePinLogin}
            className="animate-in slide-in-from-right duration-300 text-center"
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="mb-8 mt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4 border-2 border-amber-500/30">
                <KeyRound size={28} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {shopData.shop_name}
              </h2>
              <p className="text-zinc-400 text-sm">Insira seu PIN de acesso</p>
            </div>

            <div className="flex justify-center mb-8">
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} // Aceita apenas números
                className="w-48 bg-zinc-950 border border-zinc-700 rounded-2xl py-4 text-center text-3xl font-black tracking-[0.5em] text-amber-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-800"
                placeholder="••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              Entrar no Sistema
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

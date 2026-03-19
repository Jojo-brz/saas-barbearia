/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Calendar,
  Users,
  Scissors,
  Wallet,
  Package,
  LogOut,
  ShoppingCart,
  XCircle,
  CheckCircle2,
  Share2, // Ícone adicionado
} from "lucide-react";
import { fetchComSeguranca } from "../../utils/api";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shopSlug, setShopSlug] = useState(""); // Novo estado para guardar o slug

  // Estados para o Modal de Venda de Balcão
  const [showBalcaoModal, setShowBalcaoModal] = useState(false);
  const [itemDesc, setItemDesc] = useState("");
  const [itemValor, setItemValor] = useState("");
  const [loadingBalcao, setLoadingBalcao] = useState(false);
  const [tipoVenda, setTipoVenda] = useState("produto"); // "produto" ou "servico"

  useEffect(() => {
    const token = localStorage.getItem("saas_token");
    const userData = localStorage.getItem("saas_user");
    const shopData = localStorage.getItem("connected_shop"); // Busca os dados da loja salva

    if (!token || !userData) {
      router.push("/login");
    } else {
      setUser(JSON.parse(userData));

      // Define o slug para podermos montar o link
      if (shopData) {
        setShopSlug(JSON.parse(shopData).slug);
      }
    }
  }, [router]);

  const handleLogout = () => {
    // Remove apenas a sessão do barbeiro/gerente
    localStorage.removeItem("saas_token");
    localStorage.removeItem("saas_user");

    toast.success("Sessão encerrada");

    // Volta para o login (que agora vai abrir direto no PIN)
    router.push("/login");
  };

  // FUNÇÃO QUE ENVIA A VENDA PARA O CAIXA
  const handleConfirmarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc || !itemValor) return toast.error("Preencha todos os campos");

    setLoadingBalcao(true);
    const tid = toast.loading("Registrando venda...");

    try {
      const token = localStorage.getItem("saas_token");
      const res = await fetchComSeguranca(
        "http://127.0.0.1:8000/admin/venda-balcao",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            item: itemDesc,
            valor: parseFloat(itemValor),
            tipo: tipoVenda,
          }),
        },
      );

      if (!res.ok) throw new Error("Erro");

      toast.success("Venda registrada no caixa!", { id: tid });
      setShowBalcaoModal(false); // Fecha a janelinha
      setItemDesc(""); // Limpa os campos
      setItemValor("");
    } catch (error) {
      toast.error("Falha ao registrar venda", { id: tid });
    } finally {
      setLoadingBalcao(false);
    }
  };

  if (!user) return null;
  const isManager = user.role === "OWNER" || user.role === "GERENTE";

  return (
    <main className="min-h-screen bg-zinc-50 pb-10">
      <header className="bg-zinc-900 px-6 py-8 text-white rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 font-medium">Bem-vindo(a),</p>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            {!isManager && (
              <span className="text-xs bg-zinc-800 text-amber-500 px-2 py-1 rounded-md mt-1 inline-block font-bold uppercase tracking-widest">
                Barbeiro
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 transition-all hover:bg-zinc-700 active:scale-95"
          >
            <LogOut size={18} className="text-zinc-300" />
          </button>
        </div>
      </header>

      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">
          Acesso Rápido
        </h2>

        {/* ================= BOTÃO COMPARTILHAR LINK ================= */}
        {shopSlug && (
          <button
            onClick={() => {
              // window.location.origin pega a URL atual (ex: http://localhost:3000 ou https://seusite.com)
              const url = `${window.location.origin}/${shopSlug}`;
              navigator.clipboard.writeText(url);
              toast.success("Link copiado! Cole no WhatsApp ou Instagram.");
            }}
            className="w-full mb-4 flex items-center justify-between rounded-2xl bg-white p-5 border border-zinc-200 shadow-sm transition-all hover:border-amber-500 hover:shadow-md active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <Share2 size={24} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-zinc-800">
                  Link para Clientes
                </span>
                <span className="block text-xs font-medium text-zinc-500 mt-0.5">
                  /{shopSlug}
                </span>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg uppercase tracking-wider group-hover:bg-amber-100">
              Copiar
            </div>
          </button>
        )}

        {/* BOTÃO QUE ABRE A JANELA DE VENDA DE BALCÃO */}
        <button
          onClick={() => setShowBalcaoModal(true)}
          className="w-full mb-4 flex items-center justify-between rounded-2xl bg-amber-500 p-6 shadow-md transition-all hover:bg-amber-600 active:scale-95"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10 text-black">
              <ShoppingCart size={24} strokeWidth={2} />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-black/70 uppercase tracking-wider">
                Cliente sem horário
              </span>
              <span className="block text-xl font-black text-black">
                Venda de Balcão
              </span>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/admin/agenda")}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 transition-all hover:shadow-md hover:border-zinc-300 active:scale-95 group"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white">
              <Calendar size={24} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
              Agenda
            </span>
          </button>

          <button
            onClick={() => router.push("/admin/inventory")}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 transition-all hover:shadow-md hover:border-zinc-300 active:scale-95 group"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white">
              <Package size={24} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
              Estoque
            </span>
          </button>

          {isManager && (
            <>
              <button
                onClick={() => router.push("/admin/equipe")}
                className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 transition-all hover:shadow-md hover:border-zinc-300 active:scale-95 group"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white">
                  <Users size={24} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
                  Equipe
                </span>
              </button>

              <button
                onClick={() => router.push("/admin/servicos")}
                className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 transition-all hover:shadow-md hover:border-zinc-300 active:scale-95 group"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white">
                  <Scissors size={24} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
                  Serviços
                </span>
              </button>

              <button
                onClick={() => router.push("/admin/perfil")}
                className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 transition-all hover:shadow-md hover:border-zinc-300 active:scale-95 group"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white">
                  <Scissors size={24} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
                  Perfil da loja
                </span>
              </button>
            </>
          )}

          <button
            onClick={() => router.push("/admin/financeiro")}
            className="col-span-2 flex items-center justify-between rounded-2xl bg-zinc-900 p-6 shadow-md transition-all hover:bg-zinc-800 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-white">
                <Wallet size={24} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-medium text-zinc-400">
                  Financeiro
                </span>
                <span className="block text-lg font-bold text-white">
                  {isManager ? "Caixa do dia" : "Meu caixa do dia"}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ================= MODAL DA VENDA DE BALCÃO ================= */}
      {showBalcaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-900">Caixa Rápido</h2>
              <button
                onClick={() => setShowBalcaoModal(false)}
                className="text-zinc-400 hover:text-red-500"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="produto"
                  checked={tipoVenda === "produto"}
                  onChange={(e) => setTipoVenda(e.target.value)}
                  className="accent-amber-500"
                />
                <span className="text-sm font-bold text-zinc-700">
                  🛍️ Venda de Produto
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="servico"
                  checked={tipoVenda === "servico"}
                  onChange={(e) => setTipoVenda(e.target.value)}
                  className="accent-amber-500"
                />
                <span className="text-sm font-bold text-zinc-700">
                  ✂️ Corte s/ Agenda
                </span>
              </label>
            </div>

            <form onSubmit={handleConfirmarVenda} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  O que foi vendido/feito?
                </label>
                <input
                  type="text"
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Ex: Corte de Cabelo / Pomada"
                  className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:border-amber-500 focus:ring-1 ring-amber-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Valor Cobrado (R$)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={itemValor}
                  onChange={(e) => setItemValor(e.target.value)}
                  placeholder="Ex: 15.00"
                  className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:border-amber-500 focus:ring-1 ring-amber-500 text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loadingBalcao}
                className="w-full flex justify-center items-center gap-2 bg-amber-500 text-black font-black text-lg py-4 rounded-2xl shadow-xl active:scale-95 transition-transform mt-6"
              >
                <CheckCircle2 size={24} />
                {loadingBalcao ? "Salvando..." : "Confirmar Venda"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

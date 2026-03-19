/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  Package,
  Scissors,
  Phone,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AgendaMobile() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [barbershopId, setBarbershopId] = useState<number | null>(null);

  // Controle do Modal
  const [selectedAppo, setSelectedAppo] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("saas_user") || "{}");
    if (user.barbershop_id) setBarbershopId(user.barbershop_id);
  }, []);

  // --- FUNÇÃO AUXILIAR PARA OBTER OS HEADERS COM O TOKEN ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("saas_token");
    if (!token) {
      toast.error("Sessão inválida. Faça login.");
      router.push("/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 🔑 Aqui está a nossa "Chave"
    };
  };

  const loadData = async () => {
    if (!barbershopId) return;

    const headers = getAuthHeaders();
    if (!headers) return; // Se não houver token, para a execução

    try {
      // Carrega a Agenda apresentando o token
      const resAgenda = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/${barbershopId}/appointments`,
        { headers },
      );

      if (resAgenda.status === 401 || resAgenda.status === 403) {
        toast.error("Acesso negado. Sessão expirada.");
        router.push("/login");
        return;
      }

      const dataAgenda = await resAgenda.json();
      setAppointments(Array.isArray(dataAgenda) ? dataAgenda : []);

      // Carrega o Estoque apresentando o token
      const resStock = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/${barbershopId}/products`,
        { headers },
      );
      const dataStock = await resStock.json();
      setProducts(Array.isArray(dataStock) ? dataStock : []);
    } catch (err) {
      toast.error("Erro ao carregar dados. Verifique o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barbershopId) {
      loadData();
    }
  }, [barbershopId]);

  // Função para Finalizar ou Cancelar
  const handleStatusUpdate = async (
    id: number,
    newStatus: "concluido" | "cancelado",
  ) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    const tid = toast.loading("A processar...");
    try {
      // Usamos a rota de status que vamos garantir que está no main.py
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (res.ok) {
        toast.success(
          newStatus === "concluido"
            ? "Concluído! Enviado para o Financeiro."
            : "Agendamento Cancelado",
          { id: tid },
        );

        // 1. Fecha o modal/detalhe que estava aberto
        setSelectedAppo(null);

        // 2. RECARREGA OS DADOS: Isso é o que faz o agendamento sumir da tela,
        // pois o backend agora só vai enviar os que estão com status "scheduled".
        loadData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Falha na atualização");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na operação", { id: tid });
    }
  };

  // Função para vender produto de dentro da agenda
  const handleQuickSell = async (productId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      // Note que aqui não enviamos "body", logo podemos passar apenas os headers
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/sell`,
        {
          method: "PATCH",
          headers: headers,
        },
      );

      if (res.ok) {
        toast.success("Produto adicionado à comanda!", { icon: "🛍️" });
        loadData();
      } else {
        toast.error("Estoque esgotado ou erro de permissão!");
      }
    } catch (err) {
      toast.error("Erro ao vender produto");
    }
  };

  const pendentes = appointments.filter((a: any) => a.status === "scheduled");

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 text-zinc-900 relative">
      {/* ... (O resto do layout visual continua EXATAMENTE igual, não alterei nada do design) ... */}
      <header className="bg-white border-b p-5 pt-10 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-black italic flex items-center gap-2 uppercase">
          <CalendarIcon className="text-amber-500" size={28} /> Agenda
        </h1>
        <p className="text-sm font-medium text-zinc-500 mt-1">
          Hoje, {pendentes.length} clientes na fila
        </p>
      </header>

      <main className="p-4 space-y-3">
        {pendentes.map((apt: any) => {
          const dateObj = new Date(apt.date_time);
          return (
            <div
              key={apt.id}
              onClick={() => setSelectedAppo(apt)}
              className="bg-white p-5 rounded-[28px] shadow-sm border border-zinc-200 flex flex-col gap-2 relative overflow-hidden active:bg-zinc-50 cursor-pointer transition-colors"
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500" />
              <div className="flex justify-between items-start pl-2">
                <div>
                  <h3 className="font-bold text-xl text-zinc-800">
                    {apt.client_name}
                  </h3>
                  <p className="text-zinc-500 text-sm flex items-center gap-1 mt-1 font-medium">
                    <Clock size={14} className="text-amber-500" />
                    {dateObj.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                  Atender
                </button>
              </div>
            </div>
          );
        })}

        {pendentes.length === 0 && !loading && (
          <div className="text-center py-20 text-zinc-400">
            <CheckCircle2
              size={56}
              className="mx-auto mb-3 opacity-20 text-green-500"
            />
            <p className="font-bold text-lg">Tudo limpo!</p>
            <p className="text-sm">Nenhum cliente a aguardar.</p>
          </div>
        )}
      </main>

      {/* MODAL DE ATENDIMENTO */}
      {selectedAppo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          {/* Layout Centralizado: max-w-sm para ficar elegante no mobile */}
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 leading-tight">
                  {selectedAppo.client_name}
                </h2>
                <a
                  href={`https://wa.me/${selectedAppo.client_phone?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 font-bold flex items-center gap-1.5 mt-2 bg-emerald-50 w-fit px-3 py-1 rounded-full text-xs"
                >
                  <Phone size={14} fill="currentColor" />
                  WHATSAPP
                </a>
              </div>
              <button
                onClick={() => setSelectedAppo(null)}
                className="p-2 bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* PRODUTOS (COM TRAVA DE ESTOQUE VAZIO) */}
            <div className="mb-8">
              <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4 ml-1">
                Venda de Produto
              </h3>

              {/* Verifica se existem produtos com estoque */}
              {products?.filter((p: any) => p.stock_quantity > 0).length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {products
                    .filter((p: any) => p.stock_quantity > 0)
                    .map((prod: any) => (
                      <button
                        key={prod.id}
                        onClick={() => handleQuickSell(prod.id)}
                        className="shrink-0 bg-zinc-50 border border-zinc-100 p-4 rounded-3xl flex flex-col items-center gap-2 min-w-25 active:scale-95 transition-all"
                      >
                        <ShoppingBag size={20} className="text-zinc-300" />
                        <span className="text-[10px] font-black text-zinc-700 uppercase">
                          {prod.name}
                        </span>
                        <span className="text-[10px] font-black text-amber-600">
                          R${prod.price}
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl py-6 text-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase">
                    Sem itens em estoque
                  </p>
                </div>
              )}
            </div>

            {/* AÇÕES DE STATUS */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleStatusUpdate(selectedAppo.id, "cancelado")}
                className="bg-red-50 text-red-600 font-black py-5 rounded-3xl text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <XCircle size={20} /> CANCELAR
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedAppo.id, "concluido")}
                className="bg-zinc-900 text-white font-black py-5 rounded-3xl text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xl shadow-zinc-200"
              >
                <CheckCircle2 size={20} className="text-amber-500" /> CONCLUIR
              </button>
            </div>

            <button
              onClick={() => setSelectedAppo(null)}
              className="w-full bg-white text-zinc-400 font-black py-4 rounded-3xl text-[10px] uppercase tracking-widest border border-zinc-100 active:scale-95 transition-all"
            >
              VOLTAR
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t p-4 flex justify-around items-center rounded-t-4xl shadow-2xl z-0">
        <div className="flex flex-col items-center gap-1 text-amber-600">
          <div className="bg-amber-100 p-2 rounded-xl">
            <CalendarIcon size={22} />
          </div>
          <span className="text-[10px] font-bold">Agenda</span>
        </div>
        <div
          className="flex flex-col items-center gap-1 text-zinc-400"
          onClick={() => router.push("/admin/inventory")}
        >
          <div className="p-2">
            <Package size={24} />
          </div>
          <span className="text-[10px] font-medium">Estoque</span>
        </div>
      </nav>
    </div>
  );
}

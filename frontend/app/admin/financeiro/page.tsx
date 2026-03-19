/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Send,
  XCircle,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";

export default function FinanceDashboard() {
  const router = useRouter();
  const [financeData, setFinanceData] = useState<any>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);

  // Estados do Formulário
  const [email, setEmail] = useState("");
  const [obs, setObs] = useState("");
  const [tipoFechamento, setTipoFechamento] = useState("diario"); // "diario" ou "mensal"
  const [loading, setLoading] = useState(false);

  const [userRole, setUserRole] = useState("");
  const [barbershopId, setBarbershopId] = useState<number | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("saas_user") || "{}");
    if (user.barbershop_id) setBarbershopId(user.barbershop_id);
    if (user.role) setUserRole(user.role);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("saas_token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const loadFinance = async () => {
      if (!barbershopId || !userRole) return;
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/${barbershopId}/financeiro?role=${userRole}`,
          { headers },
        );
        if (res.status === 401 || res.status === 403)
          return router.push("/login");

        const data = await res.json();
        setFinanceData(data);
      } catch (err) {
        toast.error("Erro ao carregar dados financeiros");
      }
    };
    loadFinance();
  }, [barbershopId, userRole]);

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    const tid = toast.loading("A processar...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/${barbershopId}/close-register`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            email,
            observations: obs,
            tipo_fechamento: tipoFechamento,
          }),
        },
      );

      if (res.ok) {
        toast.success(`Relatório enviado com sucesso!`, { id: tid });
        setShowClosingModal(false);
        setObs("");
      } else {
        toast.error("Erro ao enviar.", { id: tid });
      }
    } catch (err) {
      toast.error("Falha na conexão", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  if (!financeData)
    return (
      <div className="p-8 text-center text-zinc-500">
        A carregar painel financeiro...
      </div>
    );

  const isManager =
    userRole === "CEO" || userRole === "GERENTE" || userRole === "OWNER";

  // CALCULA O FATURAMENTO REAL BASEADO NA LISTA DE BARBEIROS
  let faturamentoReal = 0;

  if (financeData?.barbeiros && financeData.barbeiros.length > 0) {
    // Se for o Gerente/Dono, soma o 'total' de todos os barbeiros
    faturamentoReal = financeData.barbeiros.reduce(
      (acc: number, b: any) => acc + Number(b.total || 0),
      0,
    );
  } else {
    // Se for só o barbeiro (ou se não tiver lista), pega o valor direto dele
    faturamentoReal = Number(
      financeData?.faturamento_total || financeData?.total || 0,
    );
  }

  // CALCULA A MÉDIA DIÁRIA AUTOMATICAMENTE NO FRONTEND
  const diaAtual = new Date().getDate() || 1;
  const mediaReal =
    Number(financeData?.media_diaria) || faturamentoReal / diaAtual;

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 text-zinc-900 relative">
      <header className="bg-white border-b p-6 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic flex items-center gap-2 uppercase">
            <DollarSign className="text-green-600" size={28} />
            {isManager ? "CAIXA DA LOJA" : "MINHAS COMISSÕES"}
          </h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">
            Visão de {isManager ? "Gestão Global" : "Faturamento Pessoal"}
          </p>
        </div>

        {/* O Botão adapta o nome conforme o cargo */}
        <button
          onClick={() => setShowClosingModal(true)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          <FileText size={16} />{" "}
          {isManager ? "Fechar Caixa" : "Exportar Ganhos"}
        </button>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Ganhos (Mês)
            </p>
            <p className="text-3xl font-black text-zinc-800">
              R${faturamentoReal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Média Diária
            </p>
            <p className="text-3xl font-black text-green-600 flex items-center gap-1">
              R${mediaReal.toFixed(2)}
              <TrendingUp size={20} className="text-green-500/50" />
            </p>
          </div>
        </div>

        {isManager &&
          financeData.barbeiros &&
          financeData.barbeiros.length > 0 && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200 mt-6">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={16} /> Desempenho por Barbeiro
              </h2>
              <div className="space-y-3">
                {financeData.barbeiros.map((b: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-zinc-50 rounded-2xl"
                  >
                    <span className="font-bold text-zinc-700">{b.name}</span>
                    <span className="font-black text-green-600">
                      R${b.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </main>

      {/* MODAL INTELIGENTE (Adapta-se ao Gestor ou ao Barbeiro) */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[36px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-800">
                  {isManager ? "Fechamento da Loja" : "Relatório de Ganhos"}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {isManager
                    ? "Gere o relatório financeiro do período."
                    : "Envie as suas comissões para o seu e-mail."}
                </p>
              </div>
              <button
                onClick={() => setShowClosingModal(false)}
                className="p-2 bg-zinc-100 rounded-full text-zinc-500"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCloseRegister} className="space-y-4">
              {/* O Interruptor Diário/Mensal fica para ambos, pois o barbeiro também quer saber quanto fez no mês */}
              <div className="flex bg-zinc-100 p-1.5 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setTipoFechamento("diario")}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all ${tipoFechamento === "diario" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  <DollarSign size={16} /> Dia Atual
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFechamento("mensal")}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all ${tipoFechamento === "mensal" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  <CalendarDays size={16} /> Mês Completo
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                  {isManager
                    ? "E-mail de destino do relatório"
                    : "Seu e-mail para receber o relatório"}
                </label>
                <input
                  type="email"
                  required
                  placeholder={
                    isManager
                      ? "gerencia@barbearia.com"
                      : "exemplo@seuemail.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:ring-2 ring-green-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {isManager
                    ? "Observações (Opcional)"
                    : "Relatar Quebras ao Dono (Opcional)"}
                </label>
                <textarea
                  placeholder={
                    isManager
                      ? "Anotações do dia..."
                      : "Ex: Quebrei um pente da máquina 2."
                  }
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:ring-2 ring-green-500 h-24 resize-none transition-all"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-600/20 mt-4 uppercase tracking-wider"
              >
                <Send size={20} />
                {loading
                  ? "A Processar..."
                  : isManager
                    ? `Fechar Caixa ${tipoFechamento}`
                    : `Enviar Meus Ganhos`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  User,
  Calendar,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Plus,
  Trash2,
  DollarSign,
  PlusCircle,
  MinusCircle,
  FileText,
  CheckCircle2,
  Send,
  Copy,
  Camera,
  EyeOff,
  Loader2,
  LogOut,
  X,
  Phone,
  Users,
  Edit2,
  PencilRuler,
  Clock,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// --- TIPAGENS ---
type Role = "OWNER" | "BARBER";

interface LoggedUser {
  id: string;
  name: string;
  role: Role;
}
interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  service: string;
  time: string;
  price: number;
  duration: number;
  barberId: string;
}
interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  hidePrice?: boolean;
}
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}
interface AvulsoSale {
  id: string;
  description: string;
  price: number;
  time: string;
  barberId: string;
}
interface TeamMember {
  id: string;
  name: string;
  role: Role;
  pin: string;
  photo_url?: string;
}
interface Barbershop {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  services: Service[];
  team: TeamMember[];
}

// O ÚNICO MOCK QUE SOBROU (Produtos - pois ainda não tem backend)
const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "Pomada Efeito Matte", price: 45, stock: 12 },
  { id: "p2", name: "Cerveja Long Neck", price: 12, stock: 24 },
];

export default function AdminDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Estados de Dados da Barbearia (Vêm do Backend de verdade!)
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  // Login e Segurança
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [isLocked, setIsLocked] = useState(true); // O sistema começa bloqueado!
  const [selectedBarberForPin, setSelectedBarberForPin] =
    useState<TeamMember | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [shopId, setShopId] = useState<number | null>(null);

  // Estados Gerais e Layout
  const [activeTab, setActiveTab] = useState("agenda");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingEndereco, setIsSavingEndereco] = useState(false);
  const [isSavingSobre, setIsSavingSobre] = useState(false);
  // Configurações e Caixa (mantidos do seu design incrível)
  const [diasAbertos, setDiasAbertos] = useState([
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ]);
  const todosOsDias = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const [horarioAbertura, setHorarioAbertura] = useState("09:00");
  const [horarioFechamento, setHorarioFechamento] = useState("20:00");
  const [intervaloInicio, setIntervaloInicio] = useState("12:00");
  const [intervaloFim, setIntervaloFim] = useState("13:00");
  const [sobreBarbearia, setSobreBarbearia] = useState(
    "Somos uma barbearia focada em entregar a melhor experiência...",
  );
  const [endereco, setEndereco] = useState(
    "Av. Bento Gonçalves, 123 - Centro, Pelotas - RS",
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);

  const [lucroMensal, setLucroMensal] = useState<number>(0);
  const [lucroDia, setLucroDia] = useState<number>(0);
  const [vendasAvulsas, setVendasAvulsas] = useState<any[]>([]);
  const [novaVendaDesc, setNovaVendaDesc] = useState("");
  const [novaVendaValor, setNovaVendaValor] = useState("");
  const [observacaoCaixa, setObservacaoCaixa] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showClosingSuccess, setShowClosingSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testerEmail, setTesterEmail] = useState("");

  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceHidePrice, setNewServiceHidePrice] = useState(false);

  // =========================================================================
  // SALVAR INFORMAÇÕES DA VITRINE
  // =========================================================================
  const handleSaveShopInfo = async () => {
    setIsSavingInfo(true);
    try {
      // 💡 AQUI ENTRARÁ O SEU FETCH PARA ATUALIZAR O BANCO DE DADOS NO FUTURO
      // Ex: await fetch(`${API_URL}/barbershops/${barbershop.id}`, { method: 'PUT', ... })

      // Simulando um tempo de carregamento de 1 segundo para dar a sensação visual de "salvando"
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Informações da vitrine salvas com sucesso!");
      setIsEditingInfo(false); // Tranca os campos novamente!
    } catch (error) {
      toast.error("Erro ao salvar as informações.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // =========================================================================
  // SISTEMA DE ACESSO POR PIN
  // =========================================================================
  const handleUnlock = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedBarberForPin) return;

    // Forçamos ambos a serem texto e removemos espaços
    const inputLimpo = String(pinInput).trim();
    const pinRealLimpo = String(selectedBarberForPin.pin).trim();

    console.log("PIN Digitado:", inputLimpo, "| PIN do Banco:", pinRealLimpo);

    if (inputLimpo === pinRealLimpo) {
      setCurrentUser(selectedBarberForPin);
      setIsLocked(false);
      setPinInput("");
      toast.success(`Bem-vindo, ${selectedBarberForPin.name}!`);
    } else {
      toast.error("PIN Incorreto!");
      setPinInput("");
    }
  };

  // =========================================================================
  // O CORAÇÃO DO SISTEMA (CONEXÃO E SEGURANÇA)
  // =========================================================================
  useEffect(() => {
    const token = localStorage.getItem("barber_token");
    const role = localStorage.getItem("barber_role");

    // Bloqueia quem não fez login
    if (!token) {
      router.push("/login");
      return;
    }

    // =========================================================================
    // SISTEMA DE ACESSO POR PIN
    // =========================================================================

    // Puxa tudo do banco e atualiza a tela
    const fetchDashboardData = async () => {
      try {
        const resShop = await fetch(
          `http://127.0.0.1:8000/barbershops/${resolvedParams.slug}`,
        );
        if (!resShop.ok) throw new Error("Barbearia não encontrada");
        const shopData = await resShop.json();

        setBarbershop(shopData);
        setShopId(shopData.id);

        const resTeam = await fetch(
          `http://127.0.0.1:8000/barbershops/${resolvedParams.slug}/barbers`,
        );
        if (resTeam.ok) setTeam(await resTeam.json());

        const resServices = await fetch(
          `http://127.0.0.1:8000/barbershops/${resolvedParams.slug}/services`,
        );
        if (resServices.ok) setServices(await resServices.json());

        const resBookings = await fetch(
          `http://127.0.0.1:8000/barbershops/${resolvedParams.slug}/bookings`,
        );
        if (resBookings.ok) setAppointments(await resBookings.json());
      } catch (error) {
        toast.error("Erro ao carregar dados do servidor.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [resolvedParams.slug, router]);

  // =========================================================================
  // SALVAR SERVIÇO NO BANCO (FUNÇÃO NOVA)
  // =========================================================================
  const handleAddNovoServico = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("barber_token");

    if (!token) {
      toast.error(
        "Sessão expirada ou sem Token! Faça o Login Mestre novamente.",
      );
      // Opcional: router.push("/login");
      return;
    }

    const valor = parseFloat(newServicePrice.replace(",", "."));
    const duracao = parseInt(newServiceDuration);
    if (!newServiceName || isNaN(valor) || isNaN(duracao) || !shopId) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/services/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newServiceName,
          price: valor,
          duration: duracao,
          barbershop_id: shopId,
        }),
      });

      if (res.ok) {
        toast.success("Serviço adicionado no banco!");
        setShowNewServiceModal(false);
        setNewServiceName("");
        setNewServicePrice("");
        setNewServiceDuration("30");
        const novoServico = await res.json();
        setServices([...services, novoServico]);
      } else {
        toast.error("Erro ao adicionar serviço.");
      }
    } catch (error) {
      toast.error("Servidor Offline.");
    }
  };

  // --- AS SUAS FUNÇÕES ANTIGAS (handleCancelAppointment, etc) CONTINUAM DAQUI PRA BAIXO ---

  const handleCancelAppointment = (id: string) => {
    if (window.confirm("Cancelar este agendamento e liberar o horário?")) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Agendamento cancelado!");
    }
  };

  // =========================================================================
  // HANDLERS DE AÇÕES GERAIS
  // =========================================================================
  const toggleDia = (dia: string) => {
    setDiasAbertos((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "portfolio",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      if (target === "logo") setLogoUrl(fileUrl);
      else setPortfolioPhotos([...portfolioPhotos, fileUrl]);
      toast.success("Imagem atualizada com sucesso!");
    }
    e.target.value = "";
  };

  const handleAddVendaAvulsa = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(novaVendaValor.replace(",", "."));
    if (!novaVendaDesc || isNaN(v)) return;

    setVendasAvulsas([
      {
        id: Date.now().toString(),
        description: novaVendaDesc,
        price: v,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        barberId: currentUser?.id, // <-- AQUI ESTÁ A SOLUÇÃO! Atrela a venda a quem está logado.
      },
      ...vendasAvulsas,
    ]);

    // Opcional: Se você passou a usar o "receitaHojeReal" que calculamos no passo anterior,
    // você nem precisa mais desse setLucroDia aqui, pois o cálculo já é feito automaticamente!
    setLucroDia((prev) => prev + v);

    setNovaVendaDesc("");
    setNovaVendaValor("");
    toast.success("Venda manual registrada!");
  };

  const handleEditarVenda = (id: string, valorAtual: number) => {
    const novoValorStr = prompt("Digite o novo valor:", valorAtual.toString());
    if (novoValorStr === null) return; // Cancelou

    const novoValor = parseFloat(novoValorStr.replace(",", "."));
    if (isNaN(novoValor)) return alert("Valor inválido!");

    setVendasAvulsas(
      vendasAvulsas.map((v) => (v.id === id ? { ...v, price: novoValor } : v)),
    );

    toast.success("Valor atualizado!");
  };

  const handleConfirmarFechamento = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setShowEmailPrompt(false);
      setShowClosingSuccess(true);
      setTimeout(() => {
        setShowClosingSuccess(false);
        setLucroDia(0);
        setVendasAvulsas([]);
        setObservacaoCaixa("");
      }, 3000);
    }, 2000);
  };

  const handleCompleteAppointment = (app: any) => {
    setProcessingId(app.id);

    // Simula o delay de processamento
    setTimeout(() => {
      // 1. Registra o serviço no caixa do barbeiro que atendeu
      registrarVendaNoCaixa(`Serviço: ${app.service}`, app.price, app.barberId);

      // 2. Remove da agenda de "Hoje"
      setAppointments((prev) => prev.filter((a) => a.id !== app.id));

      setProcessingId(null);
      toast.success("Serviço concluído e lançado no caixa!");
    }, 800);
  };

  const handleAddNovoProduto = () => {
    const nome = prompt("Nome do produto:");
    const precoStr = prompt("Preço de venda:");
    const estoqueStr = prompt("Quantidade inicial em estoque:");

    if (!nome || !precoStr || !estoqueStr) return;

    const novoProd = {
      id: Date.now().toString(),
      name: nome,
      price: parseFloat(precoStr.replace(",", ".")),
      stock: parseInt(estoqueStr),
    };

    setProducts([...products, novoProd]);
    toast.success("Produto cadastrado com sucesso!");
  };

  const handleEditarPrecoProduto = (id: string, precoAtual: number) => {
    const novoPrecoStr = prompt(
      "Digite o novo preço de venda:",
      precoAtual.toString(),
    );

    if (novoPrecoStr === null) return; // Se o usuário cancelar

    const novoPreco = parseFloat(novoPrecoStr.replace(",", "."));

    if (isNaN(novoPreco)) {
      toast.error("Valor inválido!");
      return;
    }

    setProducts(
      products.map((p) => (p.id === id ? { ...p, price: novoPreco } : p)),
    );

    toast.success("Preço atualizado com sucesso!");
  };

  const handleDeletarProduto = (id: string, nomeProduto: string) => {
    // Uma confirmação simples, mas segura.
    const confirmacao = window.confirm(
      `Tem certeza que deseja deletar o produto "${nomeProduto}"? Esta ação não pode ser desfeita.`,
    );

    if (confirmacao) {
      setProducts(products.filter((p) => p.id !== id));
      toast.success(`${nomeProduto} removido do estoque.`);
    }
  };

  const handleLogout = () => {
    // Aqui você vai limpar o estado de quem está logado.
    // Exemplo: setCurrentUser(null); ou remover do localStorage.

    toast.success("Sessão encerrada com sucesso!");

    // Se estiver usando o useRouter do Next.js, descomente a linha abaixo para redirecionar:
    // router.push("/login");
  };

  const handleAberturaChange = (novoHorario: string) => {
    if (novoHorario >= horarioFechamento) {
      toast.error("O horário de abertura deve ser antes do fechamento!");
      return;
    }
    setHorarioAbertura(novoHorario);
  };

  const handleFechamentoChange = (novoHorario: string) => {
    if (novoHorario <= horarioAbertura) {
      toast.error("O horário de fechamento deve ser depois da abertura!");
      return;
    }
    setHorarioFechamento(novoHorario);
  };

  const handleIntervaloInicioChange = (novoHorario: string) => {
    if (novoHorario >= intervaloFim) {
      toast.error("O início do intervalo deve ser antes do fim!");
      return;
    }
    setIntervaloInicio(novoHorario);
  };

  const handleIntervaloFimChange = (novoHorario: string) => {
    if (novoHorario <= intervaloInicio) {
      toast.error("O fim do intervalo deve ser depois do início!");
      return;
    }
    setIntervaloFim(novoHorario);
  };

  // =========================================================================
  // RENDERS DAS ABAS (COM CONTROLE DE ACESSO CEO vs BARBEIRO)
  // =========================================================================

  const renderAgenda = () => (
    <div className="space-y-4 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white mb-1">Agenda de Hoje</h2>
        <p className="text-zinc-500 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-500" /> Olá,{" "}
          {currentUser?.name}. Aqui estão seus clientes.
        </p>
      </div>
      {appointments.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed text-zinc-600">
          Sem agendamentos para agora.
        </div>
      ) : (
        appointments.map((app) => (
          <div
            key={app.id}
            className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl group hover:border-zinc-700 transition-all flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-cyan-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    {app.clientName}
                    {/* Badge indicando o profissional (Visível mais para o CEO) */}
                    {currentUser?.role === "OWNER" && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                        {
                          team
                            .find((t) => t.id === app.barberId)
                            ?.name.split(" ")[0]
                        }
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-1.5">{app.service}</p>

                  {/* WhatsApp Direto */}
                  <a
                    href={`https://wa.me/55${app.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-green-500 hover:text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded-md transition-colors"
                  >
                    <Phone className="w-3 h-3" />{" "}
                    {app.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                  </a>
                </div>
              </div>
              <div className="bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-cyan-500 font-bold text-sm tracking-tight">
                {app.time}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCancelAppointment(app.id)}
                className="p-3 bg-zinc-950 text-zinc-500 rounded-2xl border border-zinc-800 hover:text-red-500 hover:border-red-500/30 transition-all"
                title="Cancelar Agendamento"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleCompleteAppointment(app)}
                disabled={processingId === app.id}
                className="flex-1 bg-cyan-600/10 text-cyan-500 py-3 rounded-2xl font-bold text-sm border border-cyan-500/20 hover:bg-cyan-600 hover:text-white transition-all"
              >
                {processingId === app.id
                  ? "Finalizando..."
                  : "Concluir Serviço"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const registrarVendaNoCaixa = (
    descricao: string,
    valor: number,
    barbeiroId: string,
  ) => {
    // 1. Atualiza a lista de vendas do dia (para o histórico)
    setVendasAvulsas((prev) => [
      {
        id: Date.now().toString(),
        description: descricao,
        price: valor,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        barberId: barbeiroId,
      },
      ...prev,
    ]);

    // 2. FAZ O VALOR SUBIR: Atualiza o faturamento mensal
    setLucroMensal((prev) => prev + valor);
  };

  const renderCaixa = () => {
    // 1. CÁLCULO UNIFICADO:
    // Agora a receita de hoje vem APENAS de vendasAvulsas,
    // porque os serviços concluídos já são jogados para lá.
    const receitaHojeReal = vendasAvulsas.reduce(
      (acc, curr) => acc + curr.price,
      0,
    );

    return (
      <div className="animate-fade-in-up space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white">
            {currentUser?.role === "OWNER" && team.length > 1
              ? "Caixa Geral (Hub)"
              : "Meu Caixa"}
          </h2>
          <p className="text-zinc-500 text-sm">
            Resumo financeiro e fechamento do dia.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-sm">
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Receita Hoje
            </p>
            <p className="text-2xl font-black text-white">
              {formatCurrency(receitaHojeReal)}
            </p>
          </div>

          {/* 2. FATURAMENTO MENSAL: Agora ele reflete o estado lucroMensal atualizado */}
          {currentUser?.role === "OWNER" && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl opacity-60">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                Faturamento Mensal
              </p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(lucroMensal)}
              </p>
            </div>
          )}
        </div>

        {currentUser?.role === "OWNER" && team.length > 1 && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-500" /> Faturamento por
              Barbeiro
            </h3>
            <div className="space-y-3">
              {team.map((member) => {
                // Somamos o que o barbeiro produziu hoje (que está em vendasAvulsas)
                const totalBarbeiro = vendasAvulsas
                  .filter((venda) => venda.barberId === member.id)
                  .reduce((acc, curr) => acc + curr.price, 0);

                return (
                  <div
                    key={member.id}
                    className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 text-xs font-bold border border-zinc-800">
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium text-sm">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-cyan-500 font-bold">
                      {formatCurrency(totalBarbeiro)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lançar Venda (Bar / Produtos) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="text-white font-bold mb-4">
            Lançar Venda (Bar / Produtos)
          </h3>
          <form onSubmit={handleAddVendaAvulsa} className="flex gap-2 w-full">
            <input
              required
              value={novaVendaDesc}
              onChange={(e) => setNovaVendaDesc(e.target.value)}
              placeholder="O que vendeu?"
              className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
            />
            <input
              required
              type="number"
              step="0.01"
              value={novaVendaValor}
              onChange={(e) => setNovaVendaValor(e.target.value)}
              placeholder="R$"
              className="w-20 shrink-0 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
            />
            <button
              type="submit"
              className="shrink-0 bg-cyan-600 p-3 rounded-xl text-white hover:bg-cyan-500 transition-colors"
            >
              <Plus />
            </button>
          </form>
          {vendasAvulsas.map((v) => (
            <div
              key={v.id}
              className="mt-2 flex justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-sm font-medium"
            >
              <span className="text-zinc-500">
                {v.time} - {v.description}
              </span>
              <span className="text-cyan-500">{formatCurrency(v.price)}</span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-600" /> Observações Gerais
          </h3>
          <textarea
            value={observacaoCaixa}
            onChange={(e) => setObservacaoCaixa(e.target.value)}
            placeholder="Registre retiradas, pagamentos pendentes ou faltas de energia..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500 h-28 resize-none transition-colors"
          />
        </div>

        <button
          onClick={() => setShowEmailPrompt(true)}
          className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />{" "}
          {currentUser?.role === "OWNER"
            ? "Fechar Caixa do Hub"
            : "Fechar Meu Caixa"}
        </button>
      </div>
    );
  };

  const renderEquipe = () => (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Minha Equipe</h2>
          <p className="text-zinc-500 text-sm">Gerencie logins e acessos.</p>
        </div>
      </div>

      <div className="space-y-3">
        {team.map((member) => (
          <div
            key={member.id}
            className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-950 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold">{member.name}</h4>
                <p className="text-zinc-500 text-xs">
                  {member.role === "OWNER"
                    ? "Administrador (CEO)"
                    : "Barbeiro Parceiro"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">
                PIN de Acesso
              </p>
              <span className="bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-cyan-500 font-mono tracking-widest">
                {member.pin}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const renderServicos = () => (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-white">Serviços</h2>
        {/* Apenas o CEO pode adicionar serviços novos */}
        {currentUser?.role === "OWNER" && (
          <button
            onClick={() => setShowNewServiceModal(true)}
            className="bg-zinc-900 text-white p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <Plus />
          </button>
        )}
      </div>
      {services.map((s) => (
        <div
          key={s.id}
          className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-3 flex justify-between items-center group hover:border-zinc-700 transition-all"
        >
          <div>
            <h4 className="text-white font-bold flex items-center gap-2">
              {s.name}{" "}
              {s.hidePrice && (
                <span title="Preço Oculto">
                  <EyeOff className="w-4 h-4 text-zinc-600" />
                </span>
              )}
            </h4>
            <p className="text-zinc-500 text-xs">{s.duration} min</p>
          </div>
          <span className="text-cyan-500 font-bold">
            {s.hidePrice ? "Sob Consulta" : formatCurrency(s.price)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderProdutos = () => (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex justify-between items-center mb-8 px-1">
        <div>
          <h2 className="text-2xl font-black text-white">Estoque / Bar</h2>
          <p className="text-zinc-500 text-sm">
            Controle de bebidas e produtos.
          </p>
        </div>

        {currentUser?.role === "OWNER" && (
          <button
            onClick={handleAddNovoProduto}
            className="bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 group transition-all"
          >
            {/* Informações do Produto */}
            <div className="flex-1 min-w-30">
              <h3 className="text-white font-bold leading-tight flex items-center gap-2">
                {p.name}
                {/* Botão de Editar VISÍVEL e Estilizado */}
                {currentUser?.role === "OWNER" && (
                  <button
                    onClick={() => handleEditarPrecoProduto(p.id, p.price)}
                    className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 text-zinc-600 hover:text-cyan-500 active:text-cyan-500 transition-colors"
                    title="Editar Preço"
                  >
                    <PencilRuler className="w-3 h-3" />
                  </button>
                )}
              </h3>
              <p className="text-cyan-500 text-sm font-bold mt-1">
                {formatCurrency(p.price)}
              </p>
            </div>

            {/* Controles de Estoque e Deletar com proporções reduzidas */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => {
                    if (p.stock <= 0) return toast.error("Estoque esgotado!");
                    setProducts(
                      products.map((x) =>
                        x.id === p.id
                          ? { ...x, stock: Math.max(0, x.stock - 1) }
                          : x,
                      ),
                    );
                    registrarVendaNoCaixa(
                      `Produto: ${p.name}`,
                      p.price,
                      currentUser?.id || "unknown",
                    );
                    toast.success(`${p.name} vendido!`);
                  }}
                  className="text-zinc-700 hover:text-red-500 active:text-red-500 transition-colors p-0.5"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>

                <span className="text-white font-bold w-4 text-center text-xs">
                  {p.stock}
                </span>

                {currentUser?.role === "OWNER" ? (
                  <button
                    onClick={() =>
                      setProducts(
                        products.map((x) =>
                          x.id === p.id ? { ...x, stock: x.stock + 1 } : x,
                        ),
                      )
                    }
                    className="text-zinc-700 hover:text-cyan-500 active:text-cyan-500 transition-colors p-0.5"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-1"></div>
                )}
              </div>

              {/* Botão Deletar com proporção reduzida */}
              {currentUser?.role === "OWNER" && (
                <button
                  onClick={() => handleDeletarProduto(p.id, p.name)}
                  className="p-2 bg-zinc-950 text-zinc-600 hover:text-red-500 rounded-xl border border-zinc-800 transition-all active:bg-red-500/10"
                  title="Deletar Produto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="animate-fade-in-up space-y-8">
      {/* CABEÇALHO */}
      <div>
        <h2 className="text-2xl font-black text-white">Vitrine Pública</h2>
        <p className="text-zinc-500 text-sm font-medium">
          Link: barbersaas.com/sua-barbearia
        </p>
      </div>

      {/* LOGOTIPO */}
      <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group">
        <div
          onClick={() =>
            currentUser?.role === "OWNER" && logoInputRef.current?.click()
          }
          className={`w-20 h-20 bg-zinc-950 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden relative ${currentUser?.role === "OWNER" ? "cursor-pointer" : ""}`}
        >
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-cover" />
          ) : (
            <Camera className="text-zinc-800" />
          )}
          {currentUser?.role === "OWNER" && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-white font-bold">Logotipo da Barbearia</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {currentUser?.role === "OWNER"
              ? "Clique na imagem para alterar."
              : "Apenas o CEO pode alterar."}
          </p>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        ref={logoInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e, "logo")}
      />

      {/* ENDEREÇO (COM BOTÃO SALVAR) */}
      <div className="mt-4">
        <label className="text-xs text-zinc-500 mb-1 block font-bold uppercase tracking-wider">
          Endereço da Barbearia
        </label>
        <div className="relative">
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            disabled={currentUser?.role !== "OWNER"}
            placeholder="Ex: Av. Principal, 123 - Bairro"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pr-24 text-zinc-300 text-sm outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
          />
          {currentUser?.role === "OWNER" && (
            <button
              onClick={async () => {
                setIsSavingEndereco(true);
                await new Promise((resolve) => setTimeout(resolve, 800));
                toast.success("Endereço atualizado!");
                setIsSavingEndereco(false);
              }}
              disabled={isSavingEndereco}
              className="absolute right-2 top-2 bottom-2 bg-zinc-800 text-zinc-300 px-3 rounded-lg text-xs font-bold hover:bg-cyan-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {isSavingEndereco ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Salvar"
              )}
            </button>
          )}
        </div>
      </div>

      {/* HORÁRIOS */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" /> Funcionamento e Agenda
          </h3>
          {currentUser?.role === "OWNER" && (
            <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded-md">
              Define a Agenda
            </span>
          )}
        </div>

        {currentUser?.role === "OWNER" ? (
          <div className="space-y-6">
            <div>
              <label className="text-xs text-zinc-500 mb-2 block font-bold uppercase tracking-wider">
                Dias Abertos
              </label>
              <div className="flex flex-wrap gap-2">
                {todosOsDias.map((dia) => (
                  <button
                    key={dia}
                    onClick={() => toggleDia(dia)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      diasAbertos.includes(dia)
                        ? "bg-cyan-600 border-cyan-500 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {dia.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block font-bold uppercase tracking-wider">
                  Abre às
                </label>
                <input
                  type="time"
                  value={horarioAbertura}
                  onChange={(e) => handleAberturaChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block font-bold uppercase tracking-wider">
                  Fecha às
                </label>
                <input
                  type="time"
                  value={horarioFechamento}
                  onChange={(e) => handleFechamentoChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block font-bold uppercase tracking-wider">
                  Início Almoço
                </label>
                <input
                  type="time"
                  value={intervaloInicio}
                  onChange={(e) => handleIntervaloInicioChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block font-bold uppercase tracking-wider">
                  Fim Almoço
                </label>
                <input
                  type="time"
                  value={intervaloFim}
                  onChange={(e) => handleIntervaloFimChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {todosOsDias.map((dia) => (
                <span
                  key={dia}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    diasAbertos.includes(dia)
                      ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                      : "bg-zinc-950 text-zinc-700 border border-zinc-800/50"
                  }`}
                >
                  {dia.slice(0, 3)}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">
                  Horário
                </p>
                <p className="text-white font-medium">
                  {horarioAbertura} às {horarioFechamento}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">
                  Intervalo
                </p>
                <p className="text-amber-500 font-medium">
                  {intervaloInicio} às {intervaloFim}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SOBRE A BARBEARIA */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Sobre a Barbearia</h3>
          {currentUser?.role === "OWNER" && (
            <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded-md">
              Visível para o Cliente
            </span>
          )}
        </div>

        {currentUser?.role === "OWNER" ? (
          <div className="space-y-3">
            <textarea
              value={sobreBarbearia}
              onChange={(e) => setSobreBarbearia(e.target.value)}
              placeholder="Conte a história da sua barbearia, seus diferenciais e conceito do ambiente..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm outline-none focus:border-cyan-500 h-32 resize-none transition-colors"
            />
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  setIsSavingSobre(true);
                  await new Promise((resolve) => setTimeout(resolve, 800));
                  toast.success("Descrição salva com sucesso!");
                  setIsSavingSobre(false);
                }}
                disabled={isSavingSobre}
                className="bg-zinc-800 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingSobre ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Salvar Descrição
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 h-32 overflow-y-auto">
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
              {sobreBarbearia || "Nenhuma descrição informada."}
            </p>
          </div>
        )}
      </div>

      {/* GALERIA DE CORTES */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold">Galeria de Cortes</h3>
          {currentUser?.role === "OWNER" && (
            <button
              onClick={() => portfolioInputRef.current?.click()}
              className="text-xs bg-zinc-800 text-white px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              Adicionar Foto
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {portfolioPhotos.map((p, i) => (
            <div
              key={i}
              className="aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative group"
            >
              <img src={p} className="w-full h-full object-cover" />
              {currentUser?.role === "OWNER" && (
                <button
                  onClick={() =>
                    setPortfolioPhotos(
                      portfolioPhotos.filter((_, idx) => idx !== i),
                    )
                  }
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={portfolioInputRef}
          className="hidden"
          onChange={(e) => handleFileSelect(e, "portfolio")}
        />
      </div>
    </div>
  );

  // Menu Dinâmico: Se for OWNER vê tudo, se for BARBER vê apenas Agenda, Caixa, Produtos e Vitrine
  const menuItens = [
    { id: "agenda", icon: LayoutDashboard, label: "Agenda" },
    { id: "caixa", icon: DollarSign, label: "Caixa" },
    { id: "produtos", icon: ShoppingBag, label: "Estoque" },
    ...(currentUser?.role === "OWNER"
      ? [
          { id: "servicos", icon: Scissors, label: "Serviços" },
          // O botão de equipe só entra se houver mais de 1 pessoa no time
          ...(team.length > 1
            ? [{ id: "equipe", icon: Users, label: "Equipe" }]
            : []),
        ]
      : []),
    { id: "perfil", icon: Settings, label: "Vitrine" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  // --- TELA DE BLOQUEIO (PIN) ---
  if (isLocked || !currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Efeito de Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="z-10 w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">
              {barbershop?.name || "Barbearia"}
            </h1>
            <p className="text-zinc-500 text-sm">
              Selecione o seu perfil para acessar
            </p>
          </div>

          {!selectedBarberForPin ? (
            <div className="grid grid-cols-2 gap-4">
              {team.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedBarberForPin(member)}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center gap-3 hover:border-cyan-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-14 h-14 bg-linear-to-br from-zinc-800 to-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold shadow-inner group-hover:text-cyan-500 group-hover:border-cyan-500/30 transition-colors text-xl">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm truncate w-24">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1 tracking-widest">
                      {member.role === "OWNER" ? "👑 CEO" : "Barbeiro"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-cyan-900 to-zinc-900 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-inner text-2xl mx-auto mb-4">
                  {selectedBarberForPin.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-white font-bold text-lg">
                  {selectedBarberForPin.name}
                </h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">
                  Digite seu PIN
                </p>
              </div>

              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  // Captura o "Enter" diretamente no teclado!
                  if (e.key === "Enter" && pinInput.length === 4) {
                    handleUnlock();
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center text-3xl font-mono text-cyan-400 tracking-[1em] focus:border-cyan-500 outline-none mb-6 shadow-inner"
                placeholder="••••"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBarberForPin(null);
                    setPinInput("");
                  }}
                  className="px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 hover:text-white font-bold transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => handleUnlock()}
                  disabled={pinInput.length < 4}
                  className="flex-1 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-lg shadow-cyan-900/20"
                >
                  Entrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden relative selection:bg-cyan-500/30">
      <AnimatePresence>
        {/* MODAL FECHAMENTO CAIXA */}
        {showEmailPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full">
              <h3 className="text-white font-black text-xl mb-4 text-center">
                Relatório Diário
              </h3>
              <p className="text-zinc-500 text-xs mb-4 text-center">
                O lucro e as observações serão enviados para:
              </p>
              <input
                value={testerEmail}
                onChange={(e) => setTesterEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mb-4 outline-none focus:border-cyan-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmailPrompt(false)}
                  className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmarFechamento}
                  className="flex-1 bg-cyan-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                >
                  {isSendingEmail ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}{" "}
                  Enviar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showClosingSuccess && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-110 bg-black/90 flex items-center justify-center"
          >
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">
                Dia Concluído!
              </h2>
              <p className="text-zinc-500">
                O caixa foi reiniciado e o relatório enviado.
              </p>
            </div>
          </motion.div>
        )}

        {/* MODAL NOVO SERVIÇO */}
        {showNewServiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full">
              <h3 className="text-white font-black text-xl mb-6 flex justify-between items-center">
                Novo Serviço{" "}
                <button onClick={() => setShowNewServiceModal(false)}>
                  <X className="w-5 h-5 text-zinc-600 hover:text-white" />
                </button>
              </h3>
              <form onSubmit={handleAddNovoServico} className="space-y-4">
                <input
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Nome do serviço"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                />

                {/* SOLUÇÃO AQUI: Grid dividindo exatamente 50/50 */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                  />
                  <input
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    placeholder="Minutos"
                    className="w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <label className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={newServiceHidePrice}
                    onChange={(e) => setNewServiceHidePrice(e.target.checked)}
                    className="accent-cyan-500 w-5 h-5"
                  />
                  <span className="text-sm text-zinc-400 font-bold flex items-center gap-2">
                    Sob Consulta <EyeOff className="w-4 h-4" />
                  </span>
                </label>

                <button className="w-full bg-cyan-600 py-4 rounded-2xl text-white font-black mt-4 shadow-lg shadow-cyan-900/20 tracking-tighter hover:bg-cyan-500 transition-colors">
                  Cadastrar Serviço
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* SIDEBAR (DESKTOP) E BOTTOM NAVIGATION (MOBILE)                        */}
      {/* ===================================================================== */}
      <aside className="hidden md:flex w-64 bg-zinc-950 border-r border-zinc-900 flex-col p-6">
        <div className="flex items-center gap-2 mb-10 text-cyan-500">
          <Scissors className="w-6 h-6" />
          <h1 className="text-white font-black uppercase text-sm tracking-tighter">
            BarberSaaS
          </h1>
        </div>
        <nav className="space-y-2">
          {menuItens.map((i) => (
            <button
              key={i.id}
              onClick={() => setActiveTab(i.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${activeTab === i.id ? "bg-cyan-600/10 text-cyan-400 border border-cyan-500/10 shadow-[0_0_20px_rgba(8,145,178,0.05)]" : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400"}`}
            >
              <i.icon className="w-4 h-4" /> {i.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            setIsLocked(true); // 1. Tranca a tela
            setActiveTab("agenda"); // 2. Volta para a aba padrão
            setCurrentUser(null); // 3. Tira o utilizador atual da sessão
          }}
          className="w-full mt-auto flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-bold border border-transparent hover:border-zinc-700"
          title="Bloquear Sistema"
        >
          <Lock className="w-5 h-5" />
          <span className="hidden md:block">Bloquear</span>
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth pb-24 md:pb-12">
        <div className="max-w-2xl mx-auto">
          {activeTab === "agenda" && renderAgenda()}
          {activeTab === "caixa" && renderCaixa()}
          {activeTab === "servicos" && renderServicos()}
          {activeTab === "produtos" && renderProdutos()}
          {activeTab === "equipe" && renderEquipe()}
          {activeTab === "perfil" && renderPerfil()}
        </div>
      </main>

      {/* BOTTOM NAVIGATION (EXCLUSIVA PARA DISPOSITIVOS MÓVEIS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 flex justify-around p-3 z-50 pb-safe">
        {menuItens.map((i) => (
          <button
            key={i.id}
            onClick={() => setActiveTab(i.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === i.id ? "text-cyan-500" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            <i.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold tracking-tight">
              {i.label}
            </span>
          </button>
        ))}
        <button
          onClick={() => {
            setIsLocked(true);
            setActiveTab("agenda");
            setCurrentUser(null);
          }}
          className="flex flex-col items-center gap-1 p-2 transition-all text-zinc-500 hover:text-white"
        >
          <Lock className="w-5 h-5" />
          <span className="text-[10px] font-bold hidden sm:block">
            Bloquear
          </span>
        </button>
      </nav>
    </div>
  );
}

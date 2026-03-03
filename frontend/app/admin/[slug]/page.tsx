"use client";

import { useState, useEffect, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  Clock,
  User,
  Check,
  Loader2,
  LogOut,
  Calendar,
  Menu,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Plus,
  Image as ImageIcon,
  Phone,
  Trash2,
  DollarSign,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  FileText,
  CheckCircle2,
  Mail,
  Send,
  X,
  Copy,
  Camera,
  Crop,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// --- TIPAGENS ---
interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  service: string;
  time: string;
  price: number;
  duration: number;
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
}

// --- DADOS SIMULADOS INICIAIS ---
const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    clientName: "Carlos Eduardo",
    phone: "(53) 99123-4567",
    service: "Corte Degradê",
    time: "14:00",
    price: 35,
    duration: 45,
  },
  {
    id: "2",
    clientName: "Lucas Ferreira",
    phone: "(53) 98888-1122",
    service: "Corte + Barba",
    time: "15:30",
    price: 55,
    duration: 60,
  },
];

const INITIAL_SERVICES: Service[] = [
  {
    id: "s1",
    name: "Corte Degradê",
    price: 35,
    duration: 45,
    hidePrice: false,
  },
  {
    id: "s2",
    name: "Corte + Barba",
    price: 55,
    duration: 60,
    hidePrice: false,
  },
  {
    id: "s3",
    name: "Luzes / Platinado",
    price: 120,
    duration: 120,
    hidePrice: true,
  },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "Pomada Efeito Matte", price: 45, stock: 12 },
  { id: "p2", name: "Heineken Long Neck", price: 12, stock: 24 },
];

export default function AdminDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  // --- REFERÊNCIAS PARA UPLOAD DE ARQUIVOS ---
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS DE LAYOUT ---
  const [activeTab, setActiveTab] = useState("perfil");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- ESTADOS DE DADOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- ESTADOS DO CAIXA E FINANCEIRO ---
  const [lucroMensal] = useState(4250.0);
  const [lucroDia, setLucroDia] = useState(120.0);
  const [vendasAvulsas, setVendasAvulsas] = useState<AvulsoSale[]>([]);
  const [novaVendaDesc, setNovaVendaDesc] = useState("");
  const [novaVendaValor, setNovaVendaValor] = useState("");
  const [observacaoCaixa, setObservacaoCaixa] = useState("");

  // --- ESTADOS DE MODAIS E PERFIL ---
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showClosingSuccess, setShowClosingSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testerEmail, setTesterEmail] = useState("");

  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  // Estado para a Imagem da Logo e Fotos do Portfólio
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&q=80",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&q=80",
  ]);

  // Estados para o Sistema de Enquadramento (Crop)
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"logo" | "portfolio" | null>(
    null,
  );

  // --- FORMULÁRIOS ESTADOS ---
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceHidePrice, setNewServiceHidePrice] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setAppointments(INITIAL_APPOINTMENTS);
      setIsLoading(false);
    }, 1500);
  }, []);

  const formatCurrency = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;
  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // =========================================================================
  // SISTEMA DE UPLOAD E ENQUADRAMENTO DE IMAGENS
  // =========================================================================
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "portfolio",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setSelectedFileUrl(fileUrl);
      setUploadTarget(target);
      setShowCropModal(true);
      e.target.value = "";
    }
  };

  const handleConfirmCrop = () => {
    if (uploadTarget === "logo" && selectedFileUrl) {
      setLogoUrl(selectedFileUrl);
      toast.success("Logo atualizada com sucesso!");
    } else if (uploadTarget === "portfolio" && selectedFileUrl) {
      setPortfolioPhotos([...portfolioPhotos, selectedFileUrl]);
      toast.success("Foto adicionada ao portfólio!");
    }

    setShowCropModal(false);
    setSelectedFileUrl(null);
    setUploadTarget(null);
  };

  const handleDeletePhoto = (indexToRemove: number) => {
    if (confirm("Deseja realmente excluir esta foto do portfólio?")) {
      setPortfolioPhotos(
        portfolioPhotos.filter((_, index) => index !== indexToRemove),
      );
      toast.error("Foto removida.");
    }
  };

  // --- OUTRAS AÇÕES CRUD ---
  const handleCompleteAppointment = (app: Appointment) => {
    setProcessingId(app.id);
    setTimeout(() => {
      setAppointments((prev) => prev.filter((a) => a.id !== app.id));
      setLucroDia((prev) => prev + app.price);
      setProcessingId(null);
      toast.success("Atendimento concluído e valor em caixa!");
    }, 1000);
  };

  const handleCancelAppointment = (id: string) => {
    if (
      confirm(
        "Deseja cancelar este agendamento? O horário ficará livre para os clientes novamente.",
      )
    ) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.error("Agendamento removido.");
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(newServicePrice.replace(",", "."));
    if (isNaN(p)) return toast.error("Valor inválido");

    setServices([
      ...services,
      {
        id: Date.now().toString(),
        name: newServiceName,
        price: p,
        duration: parseInt(newServiceDuration),
        hidePrice: newServiceHidePrice,
      },
    ]);

    setShowNewServiceModal(false);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceDuration("30");
    setNewServiceHidePrice(false);
    toast.success("Serviço adicionado!");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(newProductPrice.replace(",", "."));
    const s = parseInt(newProductStock);
    if (isNaN(p) || isNaN(s)) return toast.error("Valores inválidos");

    setProducts([
      ...products,
      { id: Date.now().toString(), name: newProductName, price: p, stock: s },
    ]);
    setShowNewProductModal(false);
    setNewProductName("");
    setNewProductPrice("");
    setNewProductStock("");
    toast.success("Produto adicionado ao estoque!");
  };

  const updateStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const ns = p.stock + delta;
          return { ...p, stock: ns >= 0 ? ns : 0 };
        }
        return p;
      }),
    );
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
      },
      ...vendasAvulsas,
    ]);
    setLucroDia((prev) => prev + v);
    setNovaVendaDesc("");
    setNovaVendaValor("");
    toast.success("Venda registrada no caixa!");
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
        setTesterEmail("");
      }, 4000);
    }, 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`barbersaas.com/${resolvedParams.slug}`);
    toast.success("Link copiado! Cole na bio do seu Instagram.");
  };

  // --- RENDERS DAS ABAS ---

  const renderAgenda = () => (
    <div className="space-y-4 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-1">
          Agenda de Hoje
        </h2>
        <p className="text-zinc-400 text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-500" />
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <p className="text-xs text-zinc-500 mt-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 inline-block">
          💡 Os agendamentos são feitos exclusivamente pelos clientes através do
          seu link.
        </p>
      </div>

      {isLoading ? (
        [1, 2].map((n) => (
          <div
            key={n}
            className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl h-36 animate-pulse"
          ></div>
        ))
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
          <Check className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
          <p className="text-white font-bold">Tudo limpo!</p>
          <p className="text-zinc-500 text-sm mt-1">
            Nenhum cliente agendou horários para hoje ainda.
          </p>
        </div>
      ) : (
        appointments.map((app) => (
          <motion.div
            key={app.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl relative overflow-hidden group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-950 flex items-center justify-center rounded-2xl border border-zinc-800">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight">
                    {app.clientName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-cyan-500" />
                    <span className="text-zinc-400 text-xs font-medium">
                      {app.phone}
                    </span>
                  </div>
                  <p className="text-cyan-400 text-sm font-medium mt-1">
                    {app.service}{" "}
                    <span className="text-zinc-600 ml-1">
                      ({app.duration}m)
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="font-bold text-sm tracking-wider">
                    {app.time}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs font-semibold">
                  {formatCurrency(app.price)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCancelAppointment(app.id)}
                className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-zinc-700"
                title="Cancelar Atendimento"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleCompleteAppointment(app)}
                disabled={processingId === app.id}
                className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600 hover:text-white transition-colors border border-cyan-600/30 disabled:opacity-50"
              >
                {processingId === app.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {processingId === app.id
                  ? "Recebendo..."
                  : "Concluir & Receber"}
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderServicos = () => (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-1">
            Meus Serviços
          </h2>
          <p className="text-zinc-400 text-sm">
            Controle os serviços disponíveis para os clientes.
          </p>
        </div>
        <button
          onClick={() => setShowNewServiceModal(true)}
          className="bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-500 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-950 flex items-center justify-center rounded-2xl border border-zinc-800">
                <Scissors className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {s.name}
                  {/* CORREÇÃO DO TYPESCRIPT AQUI: <span> envolvendo o ícone para usar o title */}
                  {s.hidePrice && (
                    <span title="Preço oculto para o cliente">
                      <EyeOff className="w-4 h-4 text-zinc-600" />
                    </span>
                  )}
                </h3>
                <p className="text-zinc-500 text-sm flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> Duração: {s.duration} min
                </p>
              </div>
            </div>
            <div className="text-right">
              {s.hidePrice ? (
                <span className="bg-zinc-800 text-zinc-400 font-bold px-3 py-1.5 rounded-lg text-sm border border-zinc-700">
                  Sob Consulta
                </span>
              ) : (
                <span className="bg-cyan-500/10 text-cyan-400 font-bold px-3 py-1.5 rounded-lg text-sm border border-cyan-500/20">
                  {formatCurrency(s.price)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-1">
            Estoque & Bar
          </h2>
          <p className="text-zinc-400 text-sm">
            Atualize o estoque dos produtos.
          </p>
        </div>
        <button
          onClick={() => setShowNewProductModal(true)}
          className="bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-500 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex flex-col justify-between gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg">{prod.name}</h3>
                <p className="text-cyan-400 font-bold">
                  {formatCurrency(prod.price)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
              <span className="text-zinc-500 text-xs font-bold uppercase ml-3">
                Estoque
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateStock(prod.id, -1)}
                  className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <MinusCircle className="w-6 h-6" />
                </button>
                <span className="text-white font-bold w-6 text-center">
                  {prod.stock}
                </span>
                <button
                  onClick={() => updateStock(prod.id, 1)}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 transition-colors"
                >
                  <PlusCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCaixa = () => (
    <div className="animate-fade-in-up space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">
          Caixa & Relatórios
        </h2>
        <p className="text-zinc-400 text-sm">
          Controle financeiro e fechamento do dia.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-linear-to-br from-cyan-900/40 to-blue-900/20 border border-cyan-800/50 p-5 rounded-3xl relative overflow-hidden">
          <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-cyan-500/10" />
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            Hoje
          </p>
          <p className="text-2xl md:text-3xl font-black text-white">
            {formatCurrency(lucroDia)}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl relative overflow-hidden">
          <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-700/20" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
            Mês (Estimativa)
          </p>
          <p className="text-2xl md:text-3xl font-black text-white">
            {formatCurrency(lucroMensal + lucroDia)}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-4">
          Adicionar Venda Extra
        </h3>
        <form
          onSubmit={handleAddVendaAvulsa}
          className="flex flex-col md:flex-row gap-3"
        >
          <input
            required
            value={novaVendaDesc}
            onChange={(e) => setNovaVendaDesc(e.target.value)}
            type="text"
            placeholder="O que foi vendido?"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
          />
          <input
            required
            value={novaVendaValor}
            onChange={(e) => setNovaVendaValor(e.target.value)}
            type="number"
            step="0.01"
            placeholder="Valor (R$)"
            className="w-full md:w-32 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
          />
          <button
            type="submit"
            className="bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-cyan-500 transition-colors"
          >
            Adicionar
          </button>
        </form>
        {vendasAvulsas.length > 0 && (
          <div className="mt-4 space-y-2">
            {vendasAvulsas.map((v) => (
              <div
                key={v.id}
                className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800"
              >
                <span className="text-zinc-300 text-sm">
                  <span className="text-zinc-500 mr-2">{v.time}</span>{" "}
                  {v.description}
                </span>
                <span className="text-cyan-400 font-bold text-sm">
                  {formatCurrency(v.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-4">
          Fechamento de Caixa
        </h3>
        <textarea
          value={observacaoCaixa}
          onChange={(e) => setObservacaoCaixa(e.target.value)}
          placeholder="Observações do dia (Ex: Faltou luz por 1h)..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none h-24 resize-none mb-4"
        />
        <button
          onClick={() => setShowEmailPrompt(true)}
          className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
        >
          <FileText className="w-5 h-5" /> Finalizar Dia e Enviar Relatório
        </button>
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="animate-fade-in-up space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Meu Perfil</h2>
        <p className="text-zinc-400 text-sm">
          Personalize a página que seus clientes vão ver.
        </p>
      </div>

      {/* INPUTS DE ARQUIVO OCULTOS */}
      <input
        type="file"
        accept="image/*"
        ref={logoInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e, "logo")}
      />
      <input
        type="file"
        accept="image/*"
        ref={portfolioInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e, "portfolio")}
      />

      {/* COMPARTILHAR LINK */}
      <div className="bg-linear-to-r from-cyan-900/20 to-zinc-900 border border-cyan-800/30 p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-2">
          Link de Agendamento
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Compartilhe este link no seu WhatsApp ou Bio do Instagram para os
          clientes agendarem horários sozinhos.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2 overflow-hidden">
            <span className="text-zinc-500 font-medium">barbersaas.com/</span>
            <span className="text-cyan-400 font-bold truncate">
              {resolvedParams.slug}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-cyan-600 text-white p-3 rounded-xl hover:bg-cyan-500 transition-colors flex shrink-0 items-center justify-center"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* LOGO DA BARBEARIA */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center gap-6">
        <div
          onClick={() => logoInputRef.current?.click()}
          className="w-24 h-24 bg-zinc-950 rounded-full border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 hover:border-cyan-500 hover:text-cyan-500 transition-colors cursor-pointer overflow-hidden relative group"
        >
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Logo
              </span>
            </>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Logo da Marca</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Esta imagem vai aparecer em destaque na sua página de agendamentos.
          </p>
          <button
            onClick={() => logoInputRef.current?.click()}
            className="text-sm text-cyan-400 font-bold hover:text-cyan-300"
          >
            Alterar Imagem
          </button>
        </div>
      </div>

      {/* PORTFÓLIO DE FOTOS */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Portfólio de Cortes
            </h3>
            <p className="text-sm text-zinc-400">
              Mostre seu talento para atrair mais agendamentos.
            </p>
          </div>
          <button
            onClick={() => portfolioInputRef.current?.click()}
            className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-700 flex items-center gap-2 transition-colors border border-zinc-700"
          >
            <Plus className="w-4 h-4" /> Adicionar Foto
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolioPhotos.map((photo, i) => (
            <div
              key={i}
              className="aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden group relative"
            >
              <img
                src={photo}
                alt="Portfólio"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <button
                onClick={() => handleDeletePhoto(i)}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all z-10"
                title="Excluir Foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div
            onClick={() => portfolioInputRef.current?.click()}
            className="aspect-square bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 hover:border-cyan-500 hover:text-cyan-500 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs font-bold">Nova Foto</span>
          </div>
        </div>
      </div>
    </div>
  );

  const menuItens = [
    { id: "agenda", icon: LayoutDashboard, label: "Agenda Pública" },
    { id: "caixa", icon: DollarSign, label: "Caixa & Relatórios" },
    { id: "servicos", icon: Scissors, label: "Meus Serviços" },
    { id: "produtos", icon: ShoppingBag, label: "Estoque / Bar" },
    { id: "perfil", icon: Settings, label: "Meu Perfil" },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* =========================================================
          SISTEMA DE MODAIS FLUTUANTES 
          ========================================================= */}
      <AnimatePresence>
        {/* MODAL: ENQUADRAMENTO (CROP) DE IMAGEM */}
        {showCropModal && selectedFileUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-120 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-center"
            >
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedFileUrl(null);
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <Crop className="w-8 h-8 text-cyan-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white mb-2">
                Ajustar Imagem
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                Sua imagem será enquadrada e cortada neste formato exato (1:1).
              </p>

              {/* O Container de Visualização Quadrada */}
              <div className="w-64 h-64 border-2 border-dashed border-cyan-500 rounded-2xl overflow-hidden relative mx-auto mb-6 bg-zinc-950 flex items-center justify-center shadow-inner">
                <img
                  src={selectedFileUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={handleConfirmCrop}
                className="w-full bg-cyan-600 text-white font-bold py-4 rounded-xl hover:bg-cyan-500 transition-colors"
              >
                Confirmar Enquadramento
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: NOVO SERVIÇO */}
        {showNewServiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowNewServiceModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-white mb-6">
                Cadastrar Serviço
              </h2>
              <form onSubmit={handleAddService} className="space-y-4">
                <input
                  required
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Nome do Serviço (Ex: Degradê Navalhado)"
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                      placeholder="45,00"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Duração (Minutos)
                    </label>
                    <input
                      required
                      type="number"
                      step="5"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                </div>

                {/* CHECKBOX OPÇÃO DE OCULTAR PREÇO */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={newServiceHidePrice}
                      onChange={(e) => setNewServiceHidePrice(e.target.checked)}
                      className="w-5 h-5 accent-cyan-500 bg-zinc-900 border-zinc-700 rounded"
                    />
                    <div>
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        Ocultar preço do cliente{" "}
                        <EyeOff className="w-4 h-4 text-zinc-400" />
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Será exibido como "Sob Consulta".
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 text-white font-bold py-4 rounded-xl hover:bg-cyan-500 mt-4"
                >
                  Salvar Serviço
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: NOVO PRODUTO */}
        {showNewProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowNewProductModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-white mb-6">
                Cadastrar Produto
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <input
                  required
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Nome (Ex: Cerveja Artesanal)"
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                      placeholder="Preço"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      required
                      type="number"
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                      placeholder="Estoque Inicial"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-600 text-white font-bold py-4 rounded-xl hover:bg-cyan-500 mt-4"
                >
                  Adicionar ao Bar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL DE E-MAIL (FECHAMENTO DE CAIXA) */}
        {showEmailPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowEmailPrompt(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
                <Mail className="w-8 h-8 text-cyan-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                Testando o envio?
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                Simularemos o envio do relatório de{" "}
                <strong className="text-cyan-400">
                  {formatCurrency(lucroDia)}
                </strong>{" "}
                para você.
              </p>
              <form onSubmit={handleConfirmarFechamento} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={testerEmail}
                  onChange={(e) => setTesterEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmarFechamento()}
                    disabled={isSendingEmail}
                    className="px-6 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700"
                  >
                    Pular
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="flex-1 bg-cyan-600 text-white font-bold py-3 rounded-xl hover:bg-cyan-500 flex items-center justify-center gap-2"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}{" "}
                    {isSendingEmail ? "Enviando..." : "Enviar Relatório"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL SUCESSO DE CAIXA */}
        {showClosingSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                Caixa Fechado!
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                Enviado para:{" "}
                <span className="block text-cyan-400 font-bold mt-2 text-base">
                  {testerEmail || "WhatsApp do Dono"}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ========================================================= */}

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-cyan-900/10 blur-[150px] pointer-events-none z-0"></div>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex w-72 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-900 z-10 shrink-0 flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-cyan-600/20 flex items-center justify-center rounded-xl border border-cyan-500/30 text-cyan-500">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                {resolvedParams.slug}
              </h1>
              <p className="text-xs text-cyan-500 font-medium">
                Modo Demonstração
              </p>
            </div>
          </div>
          <nav className="space-y-2">
            {menuItens.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${activeTab === item.id ? "bg-cyan-600/10 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent"}`}
                >
                  <Icon className="w-5 h-5" /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-zinc-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-semibold text-sm"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="md:hidden fixed inset-y-0 left-0 w-3/4 max-w-sm bg-zinc-950 border-r border-zinc-900 z-50 flex flex-col"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-cyan-600/20 flex items-center justify-center rounded-xl border border-cyan-500/30 text-cyan-500">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                      {resolvedParams.slug}
                    </h1>
                  </div>
                </div>
                <nav className="space-y-2">
                  {menuItens.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${activeTab === item.id ? "bg-cyan-600/10 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                      >
                        <Icon className="w-5 h-5" /> {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 z-10">
        <header className="md:hidden h-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600/20 flex items-center justify-center rounded-xl border border-cyan-500/30 text-cyan-500">
              <Scissors className="w-5 h-5" />
            </div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider truncate w-32">
              {resolvedParams.slug}
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-3xl mx-auto pb-20 md:pb-0">
            {activeTab === "agenda" && renderAgenda()}
            {activeTab === "caixa" && renderCaixa()}
            {activeTab === "servicos" && renderServicos()}
            {activeTab === "produtos" && renderProducts()}
            {activeTab === "perfil" && renderPerfil()}
          </div>
        </main>
      </div>
    </div>
  );
}

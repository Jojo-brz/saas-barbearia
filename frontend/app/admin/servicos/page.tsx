/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  X,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
} from "lucide-react";
import { API_BASE_URL } from "../../utils/apiConfig";

export default function Servicos() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [imageUrl, setImageUrl] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("saas_token");
    const userData = localStorage.getItem("saas_user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.role === "BARBER") {
      router.push("/admin/agenda");
      return;
    }
    setUser(parsedUser);

    // CORREÇÃO: Agora buscamos pelo ID da Barbearia, que está sempre disponível!
    fetchServices(parsedUser.barbershop_id);
  }, [router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("saas_token");
    if (!token) {
      toast.error("Sessão inválida.");
      router.push("/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // CORREÇÃO NA ROTA DE BUSCA
  const fetchServices = async (shopId: number) => {
    if (!shopId) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/barbershops/${shopId}/services`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error("Erro ao carregar serviços.");
    }
  };

  const openModal = (service: any = null) => {
    if (service) {
      setEditingId(service.id);
      setName(service.name);
      setPrice(service.price.toString());
      setDuration(service.duration.toString());
      setImageUrl(service.image_url || "");
      setShowPrice(service.show_price !== false); // fallback seguro
    } else {
      setEditingId(null);
      setName("");
      setPrice("");
      setDuration("30");
      setImageUrl("");
      setShowPrice(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    const toastId = toast.loading("Salvando serviço...");

    const payload = {
      name,
      price: parseFloat(price),
      duration: parseInt(duration),
      show_price: showPrice,
      image_url: imageUrl,
      barbershop_id: user.barbershop_id,
    };

    try {
      const url = editingId
        ? `http://127.0.0.1:8000/admin/services/${editingId}`
        : `${API_BASE_URL}/admin/services`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Acesso negado ou erro ao salvar");

      toast.success(editingId ? "Atualizado!" : "Criado!", { id: toastId });
      setIsModalOpen(false);
      fetchServices(user.barbershop_id);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar este serviço?")) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/services/${id}`,
        { method: "DELETE", headers },
      );
      if (!response.ok) throw new Error("Erro ao apagar");
      toast.success("Serviço removido!");
      fetchServices(user.barbershop_id);
    } catch (err) {
      toast.error("Erro ao remover serviço.");
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-zinc-50 pb-20 relative">
      <header className="bg-white px-6 py-5 shadow-sm border-b border-zinc-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-zinc-900">Serviços</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-black px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all"
          >
            <Plus size={16} /> Novo
          </button>
        </div>
      </header>

      <div className="p-6 max-w-lg mx-auto space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Nenhum serviço cadastrado.</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-amber-600 font-bold hover:underline"
            >
              Criar o primeiro serviço
            </button>
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex items-center justify-between group"
            >
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">{svc.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 font-medium">
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} /> R${svc.price.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {svc.duration} min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(svc)}
                  className="p-2 bg-zinc-100 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-200 transition-colors"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(svc.id)}
                  className="p-2 bg-red-50 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= MODAL DE SERVIÇOS ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-900">
                {editingId ? "Editar Serviço" : "Novo Serviço"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Degradê"
                  className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:ring-2 ring-amber-500 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15.00"
                    className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:ring-2 ring-amber-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                    Duração (Min)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:ring-2 ring-amber-500 text-sm font-medium"
                  >
                    <option value="5">5 min</option>
                    <option value="10">10 min</option>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h 30m</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-amber-500 font-black py-4 rounded-2xl mt-4 active:scale-95 transition-transform"
              >
                {loading ? "A Salvar..." : "Salvar Serviço"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

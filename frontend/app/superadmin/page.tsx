/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Plus,
  Store,
  User,
  Globe,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  Trash2,
  Scissors,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchComSeguranca } from "../utils/api";
import { API_BASE_URL } from "../utils/apiConfig";

export default function SuperAdmin() {
  const router = useRouter();

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeShop, setActiveShop] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);

  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("BARBER");
  const [newEmpPin, setNewEmpPin] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("superadmin_token");
    if (!token) {
      toast.error("Acesso restrito. Faça login.");
      router.push("/superadmin/login");
    } else {
      fetchShops();
    }
  }, [router]);

  // --- A NOSSA FECHADURA DO SUPERADMIN ---
  const getSuperAdminHeaders = () => {
    const token = localStorage.getItem("superadmin_token");
    if (!token) {
      toast.error("Acesso restrito. Faça login.");
      router.push("/superadmin/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchShops = async () => {
    const headers = getSuperAdminHeaders();
    if (!headers) return;

    try {
      const response = await fetchComSeguranca(
        `${API_BASE_URL}/superadmin/barbershops`,
        { headers },
      );

      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão CEO expirada.");
        router.push("/superadmin/login");
        return;
      }

      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error("Erro no fetchShops:", error);
      toast.error("Erro ao carregar barbearias");
    }
  };

  const fetchTeam = async (shopId: number) => {
    const headers = getSuperAdminHeaders(); // Garanta que esta função retorna o Token de SuperAdmin
    if (!headers) return;

    try {
      const response = await fetchComSeguranca(
        `http://127.0.0.1:8000/super/barbershops/${shopId}/barbers`,
        { headers },
      );

      if (response.ok) {
        const data = await response.json();
        setTeam(data); // Atualiza o estado que renderiza a lista na tela
      } else {
        console.error("Erro ao buscar equipe");
      }
    } catch (error) {
      console.error("Erro de conexão ao buscar equipe");
    }
  };

  const openShopManagement = (shop: any) => {
    setActiveShop(shop);
    fetchTeam(shop.id);
  };

  const closeShopManagement = () => {
    setActiveShop(null);
    setTeam([]);
    fetchShops();
  };

  // --- FUNÇÕES DE BARBEARIA ---

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getSuperAdminHeaders();
    if (!headers) return;

    setLoading(true);
    const tid = toast.loading("Criando barbearia...");
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/barbershops`, {
        method: "POST",
        headers, // <-- Chave enviada aqui
        body: JSON.stringify({
          name: shopName,
          slug: slug.toLowerCase().replace(/ /g, "-"),
          owner_name: ownerName,
          owner_email: ownerEmail,
          password,
          initial_pin: "1234",
        }),
      });
      if (!response.ok) {
        // Isso vai capturar a mensagem EXATA do Python (ex: "E-mail já cadastrado")
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao criar barbearia");
      }
      toast.success("Barbearia criada!", { id: tid });
      setShopName("");
      setSlug("");
      setOwnerEmail("");
      setOwnerName("");
      setPassword("");
      fetchShops();
    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getSuperAdminHeaders();
    if (!headers) return;

    const tid = toast.loading("Atualizando dados...");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/super/barbershops/${activeShop.id}`,
        {
          method: "PUT",
          headers, // <-- Chave enviada aqui
          body: JSON.stringify(activeShop),
        },
      );
      if (!response.ok) throw new Error("Erro ao atualizar");
      toast.success("Dados da barbearia atualizados!", { id: tid });
    } catch (err) {
      toast.error("Falha ao atualizar", { id: tid });
    }
  };

  // --- FUNÇÕES DE EQUIPE ---

  // 1. ADICIONAR FUNCIONÁRIO (BARBEIRO OU GERENTE)
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getSuperAdminHeaders();
    if (!headers || !activeShop) return;

    const tid = toast.loading("A criar funcionário...");
    try {
      const response = await fetch(`${API_BASE_URL}/super/barbers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newEmpName,
          role: newEmpRole, // Enviará "GERENTE" ou "BARBER"
          pin: newEmpPin,
          barbershop_id: activeShop.id,
        }),
      });

      if (!response.ok) throw new Error("Falha ao criar");

      toast.success("Funcionário adicionado com sucesso!", { id: tid });

      // Limpa os campos para a próxima criação
      setNewEmpName("");
      setNewEmpPin("");
      setNewEmpRole("BARBER");

      fetchTeam(activeShop.id); // Atualiza a lista na tela
    } catch (err) {
      toast.error("Erro ao adicionar funcionário", { id: tid });
    }
  };

  // 2. ATUALIZAR CARGO OU DADOS DO FUNCIONÁRIO
  const handleUpdateRole = async (
    barberId: number,
    currentName: string,
    currentPin: string,
    newRole: string,
  ) => {
    const headers = getSuperAdminHeaders();
    if (!headers) return;

    const tid = toast.loading("A atualizar cargo...");
    try {
      await fetch(`http://127.0.0.1:8000/super/barbers/${barberId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: currentName,
          pin: currentPin,
          role: newRole, // Aqui define se o utilizador passa a ser GERENTE ou BARBER
        }),
      });

      toast.success("Cargo atualizado!", { id: tid });
      fetchTeam(activeShop.id); // Recarrega a equipa para mostrar a nova tag
    } catch (err) {
      toast.error("Erro ao atualizar cargo", { id: tid });
    }
  };

  // 3. REMOVER FUNCIONÁRIO
  const handleDeleteEmployee = async (barberId: number) => {
    if (!confirm("Tem certeza que deseja remover este funcionário?")) return;

    const headers = getSuperAdminHeaders();
    if (!headers || !activeShop) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/super/barbers/${barberId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!res.ok) throw new Error("Erro ao remover");

      toast.success("Removido com sucesso!");
      fetchTeam(activeShop.id);
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Isso apagará a barbearia, todos os barbeiros, serviços e agendamentos permanentemente. Confirmar?",
      )
    )
      return;

    const headers = getSuperAdminHeaders();
    if (!headers) return;

    const tid = toast.loading("Removendo barbearia...");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/super/barbershops/${shopId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) throw new Error("Erro ao remover");

      toast.success("Barbearia removida!", { id: tid });
      closeShopManagement(); // Fecha o modal e recarrega a lista
    } catch (err) {
      toast.error("Falha ao remover barbearia", { id: tid });
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-10 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg text-black">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel SuperAdmin</h1>
            <p className="text-zinc-500 text-sm">
              Controle Global da Plataforma
            </p>
          </div>
        </div>
        {activeShop && (
          <button
            onClick={closeShopManagement}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-all"
          >
            <ArrowLeft size={16} /> Voltar para Lista
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto">
        {!activeShop ? (
          <div className="grid md:grid-cols-2 gap-10">
            <section className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl h-fit">
              <div className="flex items-center gap-2 mb-6">
                <Plus size={20} className="text-amber-500" />
                <h2 className="text-lg font-bold">Nova Unidade</h2>
              </div>
              <form onSubmit={handleCreateShop} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Nome do Dono
                  </label>
                  <input
                    required
                    value={ownerName || ""}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-3 px-4 outline-none focus:border-amber-500 border"
                    placeholder="Ex: Carlos Silva"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Nome da barbearia
                  </label>
                  <input
                    required
                    value={shopName || ""}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-3 px-4 outline-none focus:border-amber-500 border"
                    placeholder="Barbearia Teste"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Slug (URL)
                  </label>
                  <input
                    required
                    value={slug || ""}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-3 px-4 outline-none focus:border-amber-500 border"
                    placeholder="nome-da-loja"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Email de Acesso
                  </label>
                  <input
                    required
                    type="email"
                    value={ownerEmail || ""}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-3 px-4 outline-none focus:border-amber-500 border"
                    placeholder="admin@loja.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Senha (Login Front)
                  </label>
                  <input
                    required
                    type="password"
                    value={password || ""}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-3 px-4 outline-none focus:border-amber-500 border"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-600 transition-all"
                >
                  {loading ? "Criando..." : "Criar Barbearia"}
                </button>
              </form>
            </section>

            <section>
              <h2 className="text-zinc-500 text-xs font-bold uppercase mb-4 tracking-widest px-2">
                Unidades Ativas ({shops?.length || 0})
              </h2>
              <div className="space-y-3">
                {Array.isArray(shops) &&
                  shops.map((shop) => (
                    <div
                      key={shop.id}
                      className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group"
                    >
                      <div>
                        <h3 className="font-bold text-sm text-white">
                          {shop.name}
                        </h3>
                        <p className="text-xs text-zinc-500">/{shop.slug}</p>
                      </div>
                      <button
                        onClick={() => openShopManagement(shop)}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        <Settings size={14} /> Gerenciar
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10">
            <section className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl h-fit">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Store size={20} className="text-amber-500" /> Editar Barbearia
              </h2>
              <form onSubmit={handleUpdateShop} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Nome
                  </label>
                  <input
                    value={activeShop.name || ""}
                    onChange={(e) =>
                      setActiveShop({ ...activeShop, name: e.target.value })
                    }
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-2 px-4 outline-none focus:border-amber-500 border"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Slug
                  </label>
                  <input
                    value={activeShop.slug || ""}
                    onChange={(e) =>
                      setActiveShop({ ...activeShop, slug: e.target.value })
                    }
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-2 px-4 outline-none focus:border-amber-500 border"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Email do Dono
                  </label>
                  <input
                    value={activeShop.owner_email || ""}
                    onChange={(e) =>
                      setActiveShop({
                        ...activeShop,
                        owner_email: e.target.value,
                      })
                    }
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-2 px-4 outline-none focus:border-amber-500 border"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                    Trocar Senha (Deixe em branco para manter)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={activeShop.password || ""}
                    className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-xl py-2 px-4 outline-none focus:ring-2 ring-amber-500 text-sm font-medium"
                    onChange={(e) =>
                      setActiveShop({ ...activeShop, password: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white font-black py-4 rounded-2xl active:scale-95 transition-all shadow-lg"
                  >
                    Salvar Alterações
                  </button>

                  {/* BOTÃO DE DELETAR */}
                  <button
                    type="button"
                    onClick={() => handleDeleteShop(activeShop.id)}
                    className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-100 transition-colors"
                    title="Excluir Barbearia"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </form>
            </section>

            <section>
              <h2 className="text-zinc-500 text-xs font-bold uppercase mb-4 tracking-widest px-2 flex justify-between items-center">
                Equipe ({team.length})
              </h2>

              <form
                onSubmit={handleAddEmployee}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-6 flex gap-2"
              >
                <input
                  required
                  value={newEmpName || ""}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="Nome"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none border border-zinc-700 focus:border-amber-500"
                />
                <input
                  required
                  value={newEmpPin || ""}
                  onChange={(e) => setNewEmpPin(e.target.value)}
                  placeholder="PIN"
                  maxLength={6}
                  className="w-24 bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none border border-zinc-700 focus:border-amber-500"
                />
                <select
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  className="bg-zinc-800 rounded-lg px-2 text-sm border border-zinc-700 outline-none focus:border-amber-500 text-zinc-300"
                >
                  <option value="BARBER">Barbeiro</option>
                  <option value="GERENTE">Gerente</option>
                </select>
                <button
                  type="submit"
                  className="bg-amber-500 text-black p-2 rounded-lg hover:bg-amber-600"
                >
                  <Plus size={18} />
                </button>
              </form>

              <div className="space-y-3">
                {team.map((member) => (
                  <div
                    key={member.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {member.name}
                      </h3>
                      <p className="text-xs text-zinc-500">PIN: {member.pin}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.id,
                            member.name,
                            member.pin,
                            e.target.value,
                          )
                        }
                        className={`text-xs font-bold px-2 py-1 rounded outline-none cursor-pointer ${member.role === "OWNER" || member.role === "MANAGER" ? "bg-amber-500/20 text-amber-500" : "bg-zinc-800 text-zinc-300"}`}
                        disabled={member.role === "OWNER"}
                      >
                        <option value="OWNER" disabled>
                          Dono
                        </option>
                        <option value="MANAGER">Gerente</option>
                        <option value="BARBER">Barbeiro</option>
                      </select>
                      <button
                        onClick={() => handleDeleteEmployee(member.id)}
                        className="text-zinc-600 hover:text-red-500 transition-colors"
                        disabled={member.role === "OWNER"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

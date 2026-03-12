/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

interface Barbershop {
  id: number;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [shops, setShops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Adicionar Equipe
  const [managingTeamShop, setManagingTeamShop] = useState<Barbershop | null>(
    null,
  );
  const [shopTeam, setShopTeam] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPin, setNewMemberPin] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("BARBER");

  // Form Criar (Agora com CEO)
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCeoName, setNewCeoName] = useState(""); // <-- NOVO
  const [newCeoPin, setNewCeoPin] = useState(""); // <-- NOVO

  // Form Editar
  const [editingShop, setEditingShop] = useState<Barbershop | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const getToken = () => localStorage.getItem("barber_token");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (localStorage.getItem("barber_role") !== "admin") {
      router.push("/login");
      return;
    }
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/shops`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setShops(await res.json());
    } catch {
      toast.error("Erro ao carregar lojas");
    }
    setLoading(false);
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/barbershops/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        name: newName,
        slug: newSlug.toLowerCase().replace(/\s/g, "-"),
        email: newEmail,
        password: newPassword,
        ceo_name: newCeoName, // <-- Enviando CEO para o backend
        ceo_pin: newCeoPin, // <-- Enviando PIN para o backend
      }),
    });
    if (res.ok) {
      toast.success("Barbearia e CEO criados com sucesso!");
      setNewName("");
      setNewSlug("");
      setNewEmail("");
      setNewPassword("");
      setNewCeoName(""); // <-- Limpando
      setNewCeoPin(""); // <-- Limpando
      fetchShops();
    } else {
      const err = await res.json();
      toast.error("Erro: " + (err.detail || "Falha ao criar"));
    }
  };

  const openTeamModal = async (shop: Barbershop) => {
    setManagingTeamShop(shop);
    fetchShopTeam(shop.slug);
  };

  const fetchShopTeam = async (slug: string) => {
    try {
      const res = await fetch(`${API_URL}/barbershops/${slug}/barbers`);
      if (res.ok) setShopTeam(await res.json());
    } catch {
      toast.error("Erro ao carregar equipe");
    }
  };

  const handleDeleteMember = async (barberId: number) => {
    if (!confirm("Tem a certeza que deseja remover este profissional?")) return;
    const res = await fetch(`${API_URL}/admin/barbers/${barberId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      toast.success("Profissional removido!");
      fetchShopTeam(managingTeamShop!.slug);
    }
  };

  const handleChangeRole = async (barberId: number, newRole: string) => {
    const res = await fetch(`${API_URL}/admin/barbers/${barberId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success("Cargo atualizado!");
      fetchShopTeam(managingTeamShop!.slug);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTeamShop) return;

    const res = await fetch(`${API_URL}/admin/barbers/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        name: newMemberName,
        role: newMemberRole,
        pin: newMemberPin,
        barbershop_id: managingTeamShop.id,
      }),
    });

    if (res.ok) {
      toast.success("Profissional adicionado!");
      setNewMemberName("");
      setNewMemberPin("");
      setNewMemberRole("BARBER");
      fetchShopTeam(managingTeamShop.slug); // Recarrega a lista na hora!
    } else {
      toast.error("Erro ao adicionar membro");
    }
  };

  const openEditModal = (shop: Barbershop) => {
    setEditingShop(shop);
    setEditName(shop.name);
    setEditSlug(shop.slug);
    setEditEmail(shop.email);
    setEditPassword("");
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;

    const body: any = { name: editName, slug: editSlug, email: editEmail };
    if (editPassword) body.password = editPassword;

    const res = await fetch(`${API_URL}/admin/barbershops/${editingShop.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Barbearia atualizada!");
      setEditingShop(null);
      fetchShops();
    } else {
      const err = await res.json();
      toast.error("Erro: " + (err.detail || "Falha ao atualizar"));
    }
  };

  const toggleStatus = async (id: number) => {
    await fetch(`${API_URL}/admin/toggle_status/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    toast.success("Status alterado!");
    fetchShops();
  };

  const deleteShop = async (id: number) => {
    if (confirm("Tem certeza? Essa ação é irreversível.")) {
      await fetch(`${API_URL}/admin/barbershops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Barbearia excluída.");
      fetchShops();
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading)
    return (
      <div className="p-10 text-center text-white">
        Carregando painel mestre...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-widest">
            👑 Painel Super Admin
          </h1>
          <button
            onClick={logout}
            className="text-sm bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700 uppercase"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CRIAR */}
          <div className="bg-zinc-900 p-6 rounded-lg h-fit border border-zinc-800 shadow-lg">
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wide text-zinc-100">
              Nova Barbearia
            </h2>
            <form onSubmit={handleCreateShop} className="space-y-4">
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Nome da Barbearia"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Slug (Ex: barbearia-vintage)"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Email de Login"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Senha de Login"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              {/* === NOVOS CAMPOS DO CEO === */}
              <div className="border-t border-zinc-800 pt-4 mt-2 mb-2">
                <p className="text-xs text-zinc-400 font-bold uppercase mb-3">
                  Dados do Dono (CEO)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                    placeholder="Nome"
                    value={newCeoName}
                    onChange={(e) => setNewCeoName(e.target.value)}
                    required
                  />
                  <input
                    className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500 text-center tracking-widest"
                    placeholder="PIN (4 dig)"
                    type="password"
                    maxLength={4}
                    value={newCeoPin}
                    onChange={(e) =>
                      setNewCeoPin(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>
              </div>

              <button className="w-full bg-green-600 py-3 rounded font-bold hover:bg-green-500 uppercase tracking-wide text-sm shadow-md transition-all hover:scale-[1.02]">
                Cadastrar
              </button>
            </form>
          </div>

          {/* LISTAR */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wide text-zinc-100">
              Lojas Ativas ({shops.length})
            </h2>
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:border-zinc-600 transition-all shadow-md gap-4 sm:gap-0"
              >
                {/* INFORMAÇÕES DA LOJA */}
                <div className="w-full sm:w-auto">
                  <div className="font-bold text-lg text-white">
                    {shop.name}
                  </div>
                  <div className="text-zinc-500 text-sm font-mono break-all">
                    /{shop.slug} • {shop.email}
                  </div>
                  <div
                    className={`text-xs mt-1 font-bold ${shop.is_active ? "text-green-400" : "text-red-400"}`}
                  >
                    {shop.is_active ? "ATIVO" : "SUSPENSO"}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO (Responsivos) */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => openTeamModal(shop)}
                    className="flex-1 sm:flex-none bg-blue-600 text-white text-xs px-3 py-2.5 rounded hover:bg-blue-500 uppercase font-bold text-center"
                    title="Gerenciar Equipe"
                  >
                    👥 Equipe
                  </button>

                  <button
                    onClick={() => openEditModal(shop)}
                    className="bg-yellow-600 text-white text-xs px-3 py-2.5 rounded hover:bg-yellow-500 uppercase font-bold"
                    title="Editar"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => toggleStatus(shop.id)}
                    className="flex-1 sm:flex-none bg-zinc-700 text-white text-xs px-3 py-2.5 rounded hover:bg-zinc-600 uppercase font-bold sm:w-24 text-center"
                  >
                    {shop.is_active ? "Suspender" : "Ativar"}
                  </button>

                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="bg-red-600 text-white text-xs px-3 py-2.5 rounded hover:bg-red-500 uppercase font-bold"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* MODAL DE ADICIONAR EQUIPE */}
        {/* MODAL DE GERENCIAR EQUIPE */}
        {managingTeamShop && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-inner">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
                <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                  👑 Gestão de Equipe:{" "}
                  <span className="text-cyan-500">{managingTeamShop.name}</span>
                </h2>
                <button
                  onClick={() => setManagingTeamShop(null)}
                  className="text-zinc-400 hover:text-white text-3xl font-light"
                >
                  ×
                </button>
              </div>

              {/* 1. LISTA DE MEMBROS ATUAIS */}
              <div className="mb-8">
                <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span>Profissionais Ativos ({shopTeam.length})</span>
                </h3>

                {/* Aqui definimos as colunas: 1 no mobile, 2 no desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopTeam.map((member) => (
                    <div
                      key={member.id}
                      className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between shadow-inner group hover:border-zinc-700 transition-colors"
                    >
                      {/* Topo: Nome e Iniciais */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-linear-to-br from-zinc-800 to-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold shadow-inner shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold truncate text-sm">
                            {member.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 tracking-widest">
                            PIN: {member.pin}
                          </p>
                        </div>
                      </div>

                      {/* Base: Botões Compactos (Cargo e Excluir) */}
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50">
                        <select
                          className={`text-[10px] font-bold py-1.5 px-2 rounded border outline-none cursor-pointer transition-colors ${
                            member.role === "OWNER"
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                          }`}
                          value={member.role}
                          onChange={(e) =>
                            handleChangeRole(member.id, e.target.value)
                          }
                        >
                          <option value="BARBER">BARBEIRO</option>
                          <option value="OWNER">CEO (DONO)</option>
                        </select>

                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-600 hover:text-white transition-colors"
                          title="Demitir / Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {shopTeam.length === 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 border-dashed rounded-xl p-6 text-center">
                    <p className="text-zinc-600 text-sm italic">
                      Nenhum profissional cadastrado nesta loja.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. ADICIONAR NOVO MEMBRO */}
              <div className="border-t border-zinc-800 pt-6">
                <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4">
                  ➕ Contratar Novo Profissional
                </h3>

                <form
                  onSubmit={handleAddTeamMember}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    className="w-full bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 focus:border-cyan-500 outline-none"
                    placeholder="Nome do Profissional"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                  />
                  <input
                    className="w-full bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 focus:border-cyan-500 outline-none font-mono tracking-widest"
                    placeholder="PIN (4 dígitos)"
                    type="password"
                    maxLength={4}
                    value={newMemberPin}
                    onChange={(e) =>
                      setNewMemberPin(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                  <select
                    className="w-full bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 focus:border-cyan-500 outline-none md:col-span-2"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="BARBER">
                      BARBEIRO (Apenas acessa a própria agenda)
                    </option>
                    <option value="OWNER">
                      CEO / SÓCIO (Acesso total ao Caixa e Configurações)
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="w-full bg-cyan-600 py-3.5 rounded-lg font-bold hover:bg-cyan-500 uppercase tracking-wide text-sm shadow-lg md:col-span-2 mt-2 transition-all"
                  >
                    Adicionar ao Sistema
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-700 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
              <h2 className="text-xl font-bold text-white uppercase">
                Editar Loja
              </h2>
              <button
                onClick={() => setEditingShop(null)}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateShop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Nome da Barbearia
                </label>
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Slug (URL)
                </label>
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  E-mail (Login)
                </label>
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Nova Senha (Opcional)
                </label>
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                  placeholder="Deixe vazio para manter a atual"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <button className="w-full bg-green-600 py-3 rounded font-bold hover:bg-green-500 uppercase tracking-wide text-sm shadow-lg mt-4">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

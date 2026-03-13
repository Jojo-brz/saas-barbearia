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
  owner_email: string;
  email?: string;
  is_active: boolean;
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [shops, setShops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Equipe
  const [managingTeamShop, setManagingTeamShop] = useState<Barbershop | null>(
    null,
  );
  const [shopTeam, setShopTeam] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPin, setNewMemberPin] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("BARBER");

  // Estados do Formulário Criar
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCeoName, setNewCeoName] = useState("");
  const [newCeoPin, setNewCeoPin] = useState("");

  // Estados do Formulário Editar
  const [editingShop, setEditingShop] = useState<Barbershop | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/login";
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "SUPER_ADMIN") {
      window.location.href = "/login";
    } else {
      fetchShops();
    }
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch(`${API_URL}/super/barbershops`);
      if (res.ok) {
        const data = await res.json();
        setShops(data);
      }
    } catch {
      toast.error("Erro ao carregar lojas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: newName,
      slug: newSlug,
      owner_email: newEmail,
      password_hash: newPassword,
      ceo_name: newCeoName,
      ceo_pin: newCeoPin,
    };

    try {
      const res = await fetch(`${API_URL}/super/barbershops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Barbearia criada!");
        setNewName("");
        setNewSlug("");
        setNewEmail("");
        setNewPassword("");
        setNewCeoName("");
        setNewCeoPin("");
        fetchShops();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Erro ao criar");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  // FUNÇÕES DE EQUIPE CORRIGIDAS
  const openTeamModal = async (shop: Barbershop) => {
    setManagingTeamShop(shop);
    fetchShopTeam(shop.slug); // Usando slug conforme seu backend pede
  };

  const fetchShopTeam = async (slug: string) => {
    if (!slug) return;
    const token = localStorage.getItem("barber_token");

    try {
      // Rota corrigida para bater com o padrão de slugs do seu backend
      const res = await fetch(`${API_URL}/barbershops/${slug}/barbers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setShopTeam(data); // O backend retorna a lista de objetos
      } else {
        console.error("Erro ao puxar equipe. Status:", res.status);
        setShopTeam([]);
      }
    } catch (error) {
      console.error("Falha no fetch:", error);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTeamShop) return;

    const token = localStorage.getItem("barber_token");

    // O 422 geralmente acontece aqui: o corpo do JSON precisa ser exato
    const payload = {
      name: newMemberName,
      role: newMemberRole,
      pin: newMemberPin,
      barbershop_id: Number(managingTeamShop.id), // Garante que é um número
    };

    try {
      const res = await fetch(`${API_URL}/admin/barbers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Sem isso, o backend bloqueia
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Profissional adicionado!");
        setNewMemberName("");
        setNewMemberPin("");
        fetchShopTeam(managingTeamShop.slug); // Recarrega a lista
      } else {
        const errorData = await res.json();
        // Isso vai te mostrar no toast exatamente qual campo o backend rejeitou
        toast.error(errorData.detail?.[0]?.msg || "Erro ao adicionar");
      }
    } catch (error) {
      toast.error("Erro de comunicação com o servidor");
    }
  };

  const handleDeleteMember = async (barberId: number) => {
    if (!confirm("Remover este profissional?")) return;
    const res = await fetch(`${API_URL}/admin/barbers/${barberId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Removido!");
      if (managingTeamShop) fetchShopTeam(managingTeamShop.slug);
    }
  };

  const handleChangeRole = async (barberId: number, newRole: string) => {
    const token = localStorage.getItem("barber_token");

    try {
      const res = await fetch(`${API_URL}/admin/barbers/${barberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }), // Envia o novo cargo (OWNER ou BARBER)
      });

      if (res.ok) {
        toast.success("Cargo atualizado!");
        if (managingTeamShop) fetchShopTeam(managingTeamShop.slug); // Recarrega a lista
      } else {
        toast.error("Erro ao mudar cargo");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (shop: Barbershop) => {
    setEditingShop(shop);
    setEditName(shop.name);
    setEditSlug(shop.slug);
    setEditEmail(shop.owner_email || shop.email || "");
    setEditPassword("");
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    const body: any = {
      name: editName,
      slug: editSlug,
      owner_email: editEmail,
    };
    if (editPassword) body.password_hash = editPassword;

    const res = await fetch(`${API_URL}/super/barbershops/${editingShop.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Atualizada!");
      setEditingShop(null);
      fetchShops();
    }
  };

  const toggleStatus = async (id: number) => {
    await fetch(`${API_URL}/super/toggle_status/${id}`, { method: "POST" });
    toast.success("Status alterado!");
    fetchShops();
  };

  const deleteShop = async (id: number) => {
    if (confirm("Tem certeza?")) {
      await fetch(`${API_URL}/super/barbershops/${id}`, { method: "DELETE" });
      toast.success("Excluída.");
      fetchShops();
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading)
    return <div className="p-10 text-center text-white">Carregando...</div>;

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
          <div className="bg-zinc-900 p-6 rounded-lg h-fit border border-zinc-800 shadow-lg">
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wide text-zinc-100">
              Nova Barbearia
            </h2>
            <form onSubmit={handleCreateShop} className="space-y-4">
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                placeholder="Nome da Barbearia"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                placeholder="Slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                placeholder="Email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                placeholder="Senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-400 font-bold uppercase mb-3">
                  Dados do Dono
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none"
                    placeholder="Nome"
                    value={newCeoName}
                    onChange={(e) => setNewCeoName(e.target.value)}
                    required
                  />
                  <input
                    className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 text-center"
                    placeholder="PIN"
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
              <button className="w-full bg-green-600 py-3 rounded font-bold hover:bg-green-500 uppercase text-sm">
                Cadastrar
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4 uppercase text-zinc-100">
              Lojas Ativas ({shops.length})
            </h2>
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4"
              >
                <div>
                  <div className="font-bold text-lg">{shop.name}</div>
                  <div className="text-zinc-500 text-sm">
                    /{shop.slug} • {shop.owner_email}
                  </div>
                  <div
                    className={`text-xs mt-1 font-bold ${shop.is_active ? "text-green-400" : "text-red-400"}`}
                  >
                    {shop.is_active ? "ATIVO" : "SUSPENSO"}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => openTeamModal(shop)}
                    className="flex-1 bg-blue-600 text-white text-xs px-3 py-2.5 rounded font-bold"
                  >
                    👥 Equipe
                  </button>
                  <button
                    onClick={() => openEditModal(shop)}
                    className="bg-yellow-600 text-white text-xs px-3 py-2.5 rounded font-bold"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => toggleStatus(Number(shop.id))}
                    className="bg-zinc-700 text-white text-xs px-3 py-2.5 rounded font-bold"
                  >
                    {shop.is_active ? "Suspender" : "Ativar"}
                  </button>
                  <button
                    onClick={() => deleteShop(Number(shop.id))}
                    className="bg-red-600 text-white text-xs px-3 py-2.5 rounded font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {managingTeamShop && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
                <h2 className="text-xl font-bold text-white uppercase">
                  Gestão:{" "}
                  <span className="text-cyan-500">{managingTeamShop.name}</span>
                </h2>
                <button
                  onClick={() => setManagingTeamShop(null)}
                  className="text-zinc-400 text-3xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {shopTeam.map((member) => (
                  <div
                    key={member.id}
                    className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm">
                          {member.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          PIN: {member.pin}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                      <select
                        className="text-[10px] bg-zinc-800 text-white p-1 rounded"
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
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleAddTeamMember}
                className="border-t border-zinc-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <input
                  className="bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700"
                  placeholder="Nome"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                />
                <input
                  className="bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700"
                  placeholder="PIN"
                  type="password"
                  maxLength={4}
                  value={newMemberPin}
                  onChange={(e) =>
                    setNewMemberPin(e.target.value.replace(/\D/g, ""))
                  }
                  required
                />
                <select
                  className="bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 md:col-span-2"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  <option value="BARBER">BARBEIRO</option>
                  <option value="OWNER">CEO / SÓCIO</option>
                </select>
                <button
                  type="submit"
                  className="bg-cyan-600 py-3 rounded-lg font-bold md:col-span-2 uppercase"
                >
                  Adicionar
                </button>
              </form>
            </div>
          </div>
        )}

        {editingShop && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-700 p-6">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
                <h2 className="text-xl font-bold text-white uppercase">
                  Editar Loja
                </h2>
                <button
                  onClick={() => setEditingShop(null)}
                  className="text-zinc-400 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateShop} className="space-y-4">
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome"
                />
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="Slug"
                />
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="E-mail"
                />
                <input
                  className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Senha (Opcional)"
                />
                <button className="w-full bg-green-600 py-3 rounded font-bold uppercase">
                  Salvar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

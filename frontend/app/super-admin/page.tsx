/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // <--- IMPORTAR

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

  // Form Criar
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Form Editar
  const [editingShop, setEditingShop] = useState<Barbershop | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const getToken = () => localStorage.getItem("barber_token");

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
      const res = await fetch("http://127.0.0.1:8000/admin/shops", {
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
    const res = await fetch("http://127.0.0.1:8000/barbershops/", {
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
      }),
    });
    if (res.ok) {
      toast.success("Barbearia criada com sucesso!"); // <---
      setNewName("");
      setNewSlug("");
      setNewEmail("");
      setNewPassword("");
      fetchShops();
    } else {
      const err = await res.json();
      toast.error("Erro: " + (err.detail || "Falha ao criar")); // <---
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

    const res = await fetch(
      `http://127.0.0.1:8000/admin/barbershops/${editingShop.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (res.ok) {
      toast.success("Barbearia atualizada!"); // <---
      setEditingShop(null);
      fetchShops();
    } else {
      const err = await res.json();
      toast.error("Erro: " + (err.detail || "Falha ao atualizar")); // <---
    }
  };

  const toggleStatus = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/admin/toggle_status/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    toast.success("Status alterado!");
    fetchShops();
  };

  const deleteShop = async (id: number) => {
    if (confirm("Tem certeza? Essa ação é irreversível.")) {
      await fetch(`http://127.0.0.1:8000/admin/barbershops/${id}`, {
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
    // ... (O JSX do retorno mantém-se IDÊNTICO ao anterior,
    // pois só mudamos a lógica das funções acima)
    // Vou omitir o JSX aqui para economizar espaço,
    // basta manter o JSX que você já tem no arquivo super-admin/page.tsx
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      {/* ... (Seu JSX existente) ... */}
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
                placeholder="Nome"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Slug (URL)"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <input
                className="w-full bg-zinc-800 p-3 rounded text-white border border-zinc-700 focus:border-white outline-none placeholder-zinc-500"
                placeholder="Senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
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
                className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex justify-between items-center hover:border-zinc-600 transition-all shadow-md"
              >
                <div>
                  <div className="font-bold text-lg text-white">
                    {shop.name}
                  </div>
                  <div className="text-zinc-500 text-sm font-mono">
                    /{shop.slug} • {shop.email}
                  </div>
                  <div
                    className={`text-xs mt-1 font-bold ${shop.is_active ? "text-green-400" : "text-red-400"}`}
                  >
                    {shop.is_active ? "ATIVO" : "SUSPENSO"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(shop)}
                    className="bg-yellow-600 text-white text-xs px-3 py-2 rounded hover:bg-yellow-500 uppercase font-bold"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => toggleStatus(shop.id)}
                    className="bg-zinc-700 text-xs px-3 py-2 rounded hover:bg-zinc-600 uppercase font-bold w-24"
                  >
                    {shop.is_active ? "Suspender" : "Ativar"}
                  </button>
                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="bg-red-600 text-xs px-3 py-2 rounded hover:bg-red-500 uppercase font-bold"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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

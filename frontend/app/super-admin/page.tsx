"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
    const res = await fetch("http://127.0.0.1:8000/admin/shops", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) setShops(await res.json());
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
      alert("Criado!");
      setNewName("");
      setNewSlug("");
      setNewEmail("");
      setNewPassword("");
      fetchShops();
    } else alert("Erro ao criar.");
  };

  const toggleStatus = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/admin/toggle_status/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchShops();
  };
  const deleteShop = async (id: number) => {
    if (confirm("Apagar tudo?")) {
      await fetch(`http://127.0.0.1:8000/admin/barbershops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchShops();
    }
  };
  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-yellow-500">
            👑 Painel Super Admin
          </h1>
          <button
            onClick={logout}
            className="text-sm bg-red-600 px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg h-fit border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Nova Barbearia</h2>
            <form onSubmit={handleCreateShop} className="space-y-3">
              <input
                className="w-full bg-gray-700 p-2 rounded text-white"
                placeholder="Nome"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                className="w-full bg-gray-700 p-2 rounded text-white"
                placeholder="Slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                required
              />
              <input
                className="w-full bg-gray-700 p-2 rounded text-white"
                placeholder="Email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <input
                className="w-full bg-gray-700 p-2 rounded text-white"
                placeholder="Senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button className="w-full bg-green-600 py-2 rounded font-bold">
                Cadastrar
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4">Lojas ({shops.length})</h2>
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-lg">{shop.name}</div>
                  <div className="text-gray-400 text-sm">
                    /{shop.slug} • {shop.email}
                  </div>
                  <div
                    className={`text-xs mt-1 font-bold ${
                      shop.is_active ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {shop.is_active ? "ATIVO" : "SUSPENSO"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(shop.id)}
                    className="bg-blue-600 text-xs px-3 py-2 rounded"
                  >
                    {shop.is_active ? "Suspender" : "Ativar"}
                  </button>
                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="bg-red-600 text-xs px-3 py-2 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

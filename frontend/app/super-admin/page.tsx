"use client";
import { useState, useEffect } from "react";
import BarbershopForm from "../../src/components/BarbershopForm";

interface Barbershop {
  id: number;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
}

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [shops, setShops] = useState<Barbershop[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // --- ESTADOS PARA EDIÇÃO (Modal) ---
  const [editingShop, setEditingShop] = useState<Barbershop | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetch("http://127.0.0.1:8000/barbershops/")
        .then((res) => res.json())
        .then((data) => setShops(data));
    }
  }, [isAuthenticated]);

  const toggleStatus = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/admin/toggle_status/${id}`, {
      method: "POST",
    });
    setShops(
      shops.map((shop) =>
        shop.id === id ? { ...shop, is_active: !shop.is_active } : shop
      )
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin123") setIsAuthenticated(true);
    else alert("Senha incorreta!");
  };

  // --- FUNÇÕES DE EDIÇÃO ---
  const startEditing = (shop: Barbershop) => {
    setEditingShop(shop);
    setNewEmail(shop.email); // Já preenche com o email atual
    setNewPassword(""); // Senha começa vazia (só preenche se quiser mudar)
  };

  const saveEdit = async () => {
    if (!editingShop) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (newEmail) data.email = newEmail;
    if (newPassword) data.password = newPassword;

    const res = await fetch(
      `http://127.0.0.1:8000/admin/update_barbershop/${editingShop.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    if (res.ok) {
      alert("Dados atualizados com sucesso!");
      // Atualiza a lista localmente
      setShops(
        shops.map((s) =>
          s.id === editingShop.id ? { ...s, email: newEmail } : s
        )
      );
      setEditingShop(null); // Fecha o modal
    } else {
      alert("Erro ao atualizar.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-gray-900 p-8 rounded-lg text-center border border-gray-800"
        >
          <h1 className="text-white text-2xl font-bold mb-4">
            Área Restrita ⛔
          </h1>
          <input
            type="password"
            placeholder="Senha Mestra"
            className="p-2 rounded text-black mb-4 w-full"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 w-full">
            Acessar Sistema
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10 relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500">
            🕵️‍♂️ Painel Super Admin
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors"
          >
            {showCreateForm ? "Fechar Cadastro" : "+ Nova Barbearia"}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-10 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">
              Cadastrar Novo Cliente
            </h2>
            <div className="text-black">
              <BarbershopForm />
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-gray-300 uppercase text-xs">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Barbearia</th>
                <th className="p-4">Login (E-mail)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {shops.map((shop) => (
                <tr
                  key={shop.id}
                  className="hover:bg-gray-700 transition-colors"
                >
                  <td className="p-4 text-gray-500">#{shop.id}</td>
                  <td className="p-4 font-bold">{shop.name}</td>
                  <td className="p-4 text-gray-400 text-sm">{shop.email}</td>
                  <td className="p-4">
                    {shop.is_active ? (
                      <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs border border-green-700">
                        ATIVO
                      </span>
                    ) : (
                      <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs border border-red-700">
                        SUSPENSO
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {/* BOTÃO EDITAR SENHA/EMAIL */}
                    <button
                      onClick={() => startEditing(shop)}
                      className="px-3 py-1 rounded font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white"
                      title="Alterar Senha/Email"
                    >
                      ✏️ Editar
                    </button>

                    {/* BOTÃO BLOQUEAR */}
                    <button
                      onClick={() => toggleStatus(shop.id)}
                      className={`px-3 py-1 rounded font-bold text-xs border ${
                        shop.is_active
                          ? "bg-transparent text-red-400 border-red-500 hover:bg-red-900"
                          : "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      }`}
                    >
                      {shop.is_active ? "BLOQUEAR" : "ATIVAR"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE EDIÇÃO (OVERLAY) --- */}
      {editingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600">
            <h2 className="text-xl font-bold mb-4 text-white">
              Editar Acesso: {editingShop.name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Alterar E-mail
                </label>
                <input
                  type="email"
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Alterar Senha (Opcional)
                </label>
                <input
                  type="text" // Deixei text para você ver a senha que está digitando
                  placeholder="Digite nova senha apenas se quiser mudar"
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para manter a senha atual.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingShop(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

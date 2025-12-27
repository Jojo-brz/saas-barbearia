"use client";
import { useState, useEffect } from "react";

interface Barbershop {
  id: number;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
}

export default function SuperAdmin() {
  // Estado de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [shops, setShops] = useState<Barbershop[]>([]);

  // Carrega as barbearias (Só busca se estiver logado para economizar dados)
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
    // --- SUA SENHA MESTRA AQUI ---
    if (passwordInput === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta!");
    }
  };

  // Se não tiver senha, mostra tela de bloqueio
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-gray-900 p-8 rounded-lg text-center"
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
          <button className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 w-full">
            Acessar
          </button>
        </form>
      </div>
    );
  }

  // Se tiver senha, mostra o painel
  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">
        🕵️‍♂️ Painel Super Admin
      </h1>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Barbearia</th>
              <th className="p-4">Login (E-mail)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ação</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} className="border-b border-gray-700">
                <td className="p-4">#{shop.id}</td>
                <td className="p-4 font-bold">{shop.name}</td>
                <td className="p-4 text-gray-400">{shop.email}</td>
                <td className="p-4">
                  {shop.is_active ? (
                    <span className="bg-green-600 px-2 py-1 rounded text-xs">
                      ATIVO
                    </span>
                  ) : (
                    <span className="bg-red-600 px-2 py-1 rounded text-xs">
                      SUSPENSO
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleStatus(shop.id)}
                    className={`px-3 py-1 rounded font-bold text-sm ${
                      shop.is_active
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {shop.is_active ? "Bloquear" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

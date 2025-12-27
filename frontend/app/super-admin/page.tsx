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
  const [shops, setShops] = useState<Barbershop[]>([]);

  // Carrega todas as barbearias
  useEffect(() => {
    fetch("http://127.0.0.1:8000/barbershops/")
      .then((res) => res.json())
      .then((data) => setShops(data));
  }, []);

  // Função para Bloquear/Desbloquear
  const toggleStatus = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/admin/toggle_status/${id}`, {
      method: "POST",
    });

    // Atualiza a lista na tela
    setShops(
      shops.map((shop) =>
        shop.id === id ? { ...shop, is_active: !shop.is_active } : shop
      )
    );
  };

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
                    {shop.is_active ? "Bloquear Acesso" : "Reativar Acesso"}
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

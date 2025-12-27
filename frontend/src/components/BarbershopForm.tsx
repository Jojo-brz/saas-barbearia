"use client"; // <--- Isso é OBRIGATÓRIO para usar useState e interatividade

import { useState } from "react";
import { useRouter } from "next/navigation"; // Para recarregar a página após salvar

export default function BarbershopForm() {
  const router = useRouter();

  // Estados para guardar o que o usuário digita
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Função que roda quando clica em "Salvar"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Não deixa a página recarregar do jeito antigo
    setLoading(true);

    const data = { name, slug, address };

    try {
      // Envia os dados para o Python
      const response = await fetch("http://127.0.0.1:8000/barbershops/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Barbearia criada com sucesso!");
        // Limpa os campos
        setName("");
        setSlug("");
        setAddress("");
        // Recarrega a página para mostrar a nova barbearia na lista
        router.refresh();
      } else {
        alert("Erro ao criar (verifique se o Slug já existe).");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200"
    >
      <h3 className="text-lg font-bold mb-4 text-gray-800">
        Cadastrar Nova Barbearia
      </h3>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nome da Barbearia (ex: Cortes do Jaca)"
          className="border p-2 rounded text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Slug / Link Único (ex: cortes-do-jaca)"
          className="border p-2 rounded text-black"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Endereço"
          className="border p-2 rounded text-black"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Salvando..." : "Salvar Barbearia"}
        </button>
      </div>
    </form>
  );
}

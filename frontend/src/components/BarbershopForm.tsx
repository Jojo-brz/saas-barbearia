"use client";
import { useState } from "react";

export default function BarbershopForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Não mandamos mais open_time/close_time. O backend usará o DEFAULT_HOURS.
    const data = { name, slug, email, password };

    try {
      const response = await fetch("http://127.0.0.1:8000/barbershops/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Barbearia criada com sucesso!");
        window.location.reload();
      } else {
        alert("Erro ao criar (Email ou Slug já existem).");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-black"
    >
      <h3 className="text-lg font-bold mb-4">Cadastrar Nova Barbearia</h3>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nome da Barbearia"
          className="border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Slug (Link único)"
          className="border p-2 rounded"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="E-mail de Login"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <p className="text-xs text-gray-500 italic">
          * A barbearia será criada com horário padrão (Seg-Sáb). O proprietário
          poderá alterar no painel dele.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Salvando..." : "Criar Conta"}
        </button>
      </div>
    </form>
  );
}

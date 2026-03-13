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

    // Ajustado para bater com os nomes das colunas no seu Models.py
    const data = {
      name,
      slug,
      owner_email: email,
      password_hash: password,
    };

    try {
      // Ajustado para a rota correta do Super Admin no seu main.py
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/super/barbershops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Barbearia criada com sucesso!");
        setName("");
        setSlug("");
        setEmail("");
        setPassword("");
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(
          `Erro ao criar: ${errorData.detail || "Email ou Slug já existem"}`,
        );
      }
    } catch (error) {
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md border"
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Cadastrar Nova Barbearia
      </h3>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nome da Barbearia"
          className="border p-2 rounded text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Slug (Link único - ex: barbearia-do-jojo)"
          className="border p-2 rounded text-black"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="E-mail de Login do Proprietário"
          className="border p-2 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha Inicial"
          className="border p-2 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <p className="text-xs text-gray-500 italic">
          * A barbearia será criada e o proprietário poderá gerenciar equipe e
          serviços no painel dele.
        </p>

        <button
          type="submit"
          disabled={loading}
          className={`p-2 rounded font-bold text-white transition-colors ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Criando..." : "Criar Barbearia"}
        </button>
      </div>
    </form>
  );
}

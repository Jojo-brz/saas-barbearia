"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BarbershopForm() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NOVOS CAMPOS
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [workDays, setWorkDays] = useState("Segunda a Sábado");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name,
      slug,
      email,
      password,
      open_time: openTime,
      close_time: closeTime,
      work_days: workDays,
    };

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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Abre às:</label>
            <input
              type="time"
              className="border p-2 rounded w-full"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha às:</label>
            <input
              type="time"
              className="border p-2 rounded w-full"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              required
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="Dias (Ex: Seg a Sex)"
          className="border p-2 rounded"
          value={workDays}
          onChange={(e) => setWorkDays(e.target.value)}
        />

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

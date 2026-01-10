"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await fetch("http://127.0.0.1:8000/token", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("barber_token", data.access_token);
        localStorage.setItem("barber_slug", data.slug);
        localStorage.setItem("barber_role", data.role);

        if (data.role === "admin") router.push("/super-admin");
        else router.push(`/admin/${data.slug}`);
      } else {
        alert("Dados incorretos.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Acesso ao Painel 🔐
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">
              E-mail
            </label>
            <input
              required
              type="email"
              className="w-full border p-2 rounded text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Senha
            </label>
            <input
              required
              type="password"
              className="w-full border p-2 rounded text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-blue-900 text-white font-bold py-3 rounded hover:bg-blue-800"
          >
            {loading ? "..." : "Entrar"}
          </button>
        </form>
        <p className="text-center mt-6 text-xs text-gray-400">
          <Link href="/" className="hover:underline">
            ← Voltar para Início
          </Link>
        </p>
      </div>
    </div>
  );
}

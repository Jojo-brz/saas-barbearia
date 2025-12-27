"use client";
import { useState, useEffect, use } from "react";

// Tipos
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}
interface Booking {
  id: number;
  customer_name: string;
  customer_phone: string;
  date_time: string;
  service_id: number;
}
interface Barbershop {
  id: number;
  name: string;
  slug: string;
  open_time: string;
  close_time: string;
  work_days: string;
}

export default function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [shop, setShop] = useState<Barbershop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Adicionar Serviço
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");

  // Estados para Editar Serviço
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");

  // Link para compartilhar (Montado dinamicamente)
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    // Monta o link assim que a página carrega no navegador
    setShareLink(`${window.location.origin}/${slug}`);

    const fetchData = async () => {
      try {
        const [resShop, resBookings, resServices] = await Promise.all([
          fetch(`http://127.0.0.1:8000/barbershops/${slug}`),
          fetch(`http://127.0.0.1:8000/barbershops/${slug}/bookings`),
          fetch(`http://127.0.0.1:8000/barbershops/${slug}/services`),
        ]);
        if (resShop.ok) setShop(await resShop.json());
        if (resBookings.ok) setBookings(await resBookings.json());
        if (resServices.ok) setServices(await resServices.json());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // --- AÇÕES ---

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    const res = await fetch("http://127.0.0.1:8000/services/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newServiceName,
        price: parseFloat(newServicePrice),
        duration: parseInt(newServiceDuration),
        barbershop_id: shop.id,
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      setServices([...services, saved]);
      setNewServiceName("");
      setNewServicePrice("");
      alert("Serviço adicionado!");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    const res = await fetch(`http://127.0.0.1:8000/services/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setServices(services.filter((s) => s.id !== id));
    } else {
      alert("Erro ao excluir. O serviço pode ter agendamentos vinculados.");
    }
  };

  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setEditName(service.name);
    setEditPrice(service.price.toString());
    setEditDuration(service.duration.toString());
  };

  const saveEditing = async (id: number) => {
    const res = await fetch(`http://127.0.0.1:8000/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        price: parseFloat(editPrice),
        duration: parseInt(editDuration),
      }),
    });
    if (res.ok) {
      setServices(
        services.map((s) =>
          s.id === id
            ? {
                ...s,
                name: editName,
                price: parseFloat(editPrice),
                duration: parseInt(editDuration),
              }
            : s
        )
      );
      setEditingId(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copiado para a área de transferência!");
  };

  if (loading)
    return <div className="p-10 text-center">Carregando painel...</div>;
  if (!shop)
    return <div className="p-10 text-center">Barbearia não encontrada.</div>;

  const servicesMap = services.reduce(
    (acc, s) => ({ ...acc, [s.id]: s }),
    {} as Record<number, Service>
  );
  const totalRevenue = bookings.reduce(
    (total, b) => total + (servicesMap[b.service_id]?.price || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* --- 1. CABEÇALHO --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{shop.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              🕒 {shop.work_days} das {shop.open_time} às {shop.close_time}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 w-full md:w-auto">
            <span className="text-green-700 font-bold block text-sm uppercase">
              Faturamento Total
            </span>
            <span className="text-3xl font-black text-green-900">
              R$ {totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* --- 2. LINK DE COMPARTILHAMENTO (RESTAURADO!) --- */}
        <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              📢 Link de Agendamento
            </h3>
            <p className="text-blue-200 text-sm mt-1">
              Envie este link para seus clientes agendarem:
            </p>
          </div>

          <div className="flex w-full md:w-auto bg-blue-800 rounded-lg p-1 border border-blue-700">
            <input
              readOnly
              value={shareLink}
              className="bg-transparent text-white px-4 py-2 w-full outline-none font-mono text-sm"
            />
            <button
              onClick={copyLink}
              className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap"
            >
              Copiar Link
            </button>
          </div>
        </div>

        {/* --- 3. GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ESQUERDA: AGENDAMENTOS (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📅 Agenda de Clientes
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                  <tr>
                    <th className="p-4">Horário</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Serviço</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-400">
                        Nenhum agendamento ainda.
                      </td>
                    </tr>
                  ) : (
                    bookings
                      .sort(
                        (a, b) =>
                          new Date(b.date_time).getTime() -
                          new Date(a.date_time).getTime()
                      )
                      .map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-4 font-mono text-blue-600 font-bold whitespace-nowrap">
                            {new Date(b.date_time).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-800">
                              {b.customer_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {b.customer_phone}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                              {servicesMap[b.service_id]?.name || "Excluído"}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DIREITA: SERVIÇOS (1/3) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ✂️ Catálogo de Serviços
            </h2>

            {/* Form Adicionar */}
            <form
              onSubmit={handleAddService}
              className="bg-white p-4 rounded-lg shadow border border-gray-200"
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                Adicionar Novo
              </h3>
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded text-sm text-black"
                  placeholder="Nome do Serviço"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className="w-1/2 border p-2 rounded text-sm text-black"
                    type="number"
                    placeholder="R$"
                    required
                    step="0.01"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                  />
                  <input
                    className="w-1/2 border p-2 rounded text-sm text-black"
                    type="number"
                    placeholder="Min"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                  />
                </div>
                <button className="w-full bg-gray-900 text-white text-sm py-2 rounded font-bold hover:bg-black transition-colors">
                  + Cadastrar
                </button>
              </div>
            </form>

            {/* Lista Editável */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 divide-y divide-gray-100">
              {services.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Cadastre seu primeiro serviço acima.
                </div>
              )}

              {services.map((s) => (
                <div key={s.id} className="p-3 hover:bg-gray-50">
                  {editingId === s.id ? (
                    // --- MODO EDIÇÃO ---
                    <div className="space-y-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                      <input
                        className="w-full border p-1 rounded text-sm text-black bg-white"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome"
                      />
                      <div className="flex gap-2">
                        <input
                          className="w-1/2 border p-1 rounded text-sm text-black bg-white"
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="R$"
                        />
                        <input
                          className="w-1/2 border p-1 rounded text-sm text-black bg-white"
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          placeholder="Min"
                        />
                      </div>
                      <div className="flex gap-2 text-xs pt-1">
                        <button
                          onClick={() => saveEditing(s.id)}
                          className="flex-1 bg-green-600 text-white py-1 rounded font-bold"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-400 text-white py-1 rounded font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // --- MODO VISUALIZAÇÃO ---
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {s.duration} min •{" "}
                          <span className="text-green-600 font-bold">
                            R$ {s.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditing(s)}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

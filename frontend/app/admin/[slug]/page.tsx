"use client";
import { useState, useEffect, use } from "react";

// Tipos
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  image_url?: string;
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
  hours_config: string;
  logo_url?: string;
}

// Tipos de Horário
type DayConfig = { open: string; close: string; active: boolean };
type WeekConfig = Record<string, DayConfig>;
const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAYS_TRANSLATION: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

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

  // Estados Adicionar Serviço
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceImage, setNewServiceImage] = useState("");

  // Estados Editar Serviço
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");

  // Estados Horários
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursConfig, setHoursConfig] = useState<WeekConfig>({});

  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    setShareLink(`${window.location.origin}/${slug}`);
    const fetchData = async () => {
      try {
        const [resShop, resBookings, resServices] = await Promise.all([
          fetch(`http://127.0.0.1:8000/barbershops/${slug}`),
          fetch(`http://127.0.0.1:8000/barbershops/${slug}/bookings`),
          fetch(`http://127.0.0.1:8000/barbershops/${slug}/services`),
        ]);
        if (resShop.ok) {
          const data = await resShop.json();
          setShop(data);
          try {
            setHoursConfig(JSON.parse(data.hours_config));
          } catch {}
        }
        if (resBookings.ok) setBookings(await resBookings.json());
        if (resServices.ok) setServices(await resServices.json());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // --- UPLOAD ---
  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploading(false);
      return data.url;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro no upload");
      setUploading(false);
      return null;
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !shop) return;
    const url = await handleUpload(e.target.files[0]);
    if (url) {
      await fetch(`http://127.0.0.1:8000/barbershops/${shop.id}/logo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: url }),
      });
      setShop({ ...shop, logo_url: url });
    }
  };

  const handleNewServiceImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      const url = await handleUpload(e.target.files[0]);
      if (url) setNewServiceImage(url);
    }
  };

  // --- SERVIÇOS (CRUD) ---
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
        image_url: newServiceImage,
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      setServices([...services, saved]);
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceImage("");
      alert("Serviço adicionado!");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    const res = await fetch(`http://127.0.0.1:8000/services/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setServices(services.filter((s) => s.id !== id));
  };

  const startEditing = (s: Service) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPrice(s.price.toString());
    setEditDuration(s.duration.toString());
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

  // --- HORÁRIOS ---
  const handleHourChange = (
    day: string,
    field: keyof DayConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    setHoursConfig((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };
  const saveHours = async () => {
    if (!shop) return;
    const res = await fetch(
      `http://127.0.0.1:8000/barbershops/${shop.id}/hours`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours_config: JSON.stringify(hoursConfig) }),
      }
    );
    if (res.ok) {
      alert("Horários salvos!");
      setShowHoursModal(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!shop) return <div className="p-10 text-center">Não encontrado.</div>;

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
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden border-2 border-blue-500 shrink-0">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img
                  src={shop.logo_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center h-full text-2xl">
                  💈
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Alterar logo"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{shop.name}</h1>
              <button
                onClick={() => setShowHoursModal(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                ⚙️ Configurar Horários
              </button>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
            <span className="block text-sm text-green-700 font-bold uppercase">
              Faturamento
            </span>
            <span className="block text-2xl font-black text-green-900">
              R$ {totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* LINK SHARE */}
        <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold">📢 Link de Agendamento</h3>
            <p className="text-blue-200 text-sm">Envie para seus clientes:</p>
          </div>
          <div className="flex bg-blue-800 rounded p-1 w-full md:w-auto">
            <input
              readOnly
              value={shareLink}
              className="bg-transparent text-white px-3 py-2 w-full outline-none font-mono text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                alert("Copiado!");
              }}
              className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded font-bold text-sm"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AGENDA */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">📅 Agenda</h2>
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
                      <td colSpan={3} className="p-6 text-center text-gray-400">
                        Sem agendamentos.
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
                        <tr key={b.id} className="hover:bg-blue-50">
                          <td className="p-4 font-mono text-blue-600 font-bold whitespace-nowrap">
                            {new Date(b.date_time).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-4">
                            <div className="font-bold">{b.customer_name}</div>
                            <div className="text-xs text-gray-400">
                              {b.customer_phone}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">
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

          {/* SERVIÇOS */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">✂️ Serviços</h2>
            <form
              onSubmit={handleAddService}
              className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3"
            >
              <div className="relative w-full h-32 bg-gray-100 rounded border-dashed border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                {newServiceImage ? (
                  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
                  <img
                    src={newServiceImage}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Foto do Serviço</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewServiceImage}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <input
                className="w-full border p-2 rounded text-sm text-black"
                placeholder="Nome"
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
              <button
                disabled={uploading}
                className="w-full bg-gray-900 text-white text-sm py-2 rounded font-bold hover:bg-black"
              >
                {uploading ? "Carregando..." : "+ Cadastrar"}
              </button>
            </form>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 divide-y divide-gray-100">
              {services.map((s) => (
                <div key={s.id} className="p-3 hover:bg-gray-50">
                  {editingId === s.id ? (
                    <div className="space-y-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                      <input
                        className="w-full border p-1 rounded text-sm text-black bg-white"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input
                          className="w-1/2 border p-1 rounded text-sm text-black bg-white"
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                        <input
                          className="w-1/2 border p-1 rounded text-sm text-black bg-white"
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 text-xs pt-1">
                        <button
                          onClick={() => saveEditing(s.id)}
                          className="flex-1 bg-green-600 text-white py-1 font-bold rounded"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-400 text-white py-1 font-bold rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded shrink-0 overflow-hidden">
                        {s.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                          <img
                            src={s.image_url}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-sm">
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          R$ {s.price.toFixed(2)} • {s.duration}m
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditing(s)}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
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

      {/* MODAL HORÁRIOS */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Horários</h2>
              <button
                onClick={() => setShowHoursModal(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {DAYS_ORDER.map((day) => (
                <div
                  key={day}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded border"
                >
                  <div className="font-bold w-32 text-black">
                    {DAYS_TRANSLATION[day]}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-black">
                      <input
                        type="checkbox"
                        checked={hoursConfig[day]?.active || false}
                        onChange={(e) =>
                          handleHourChange(day, "active", e.target.checked)
                        }
                      />{" "}
                      {hoursConfig[day]?.active ? "Aberto" : "Fechado"}
                    </label>
                    {hoursConfig[day]?.active && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hoursConfig[day]?.open}
                          onChange={(e) =>
                            handleHourChange(day, "open", e.target.value)
                          }
                          className="border p-1 rounded text-black"
                        />
                        <span className="text-black">às</span>
                        <input
                          type="time"
                          value={hoursConfig[day]?.close}
                          onChange={(e) =>
                            handleHourChange(day, "close", e.target.value)
                          }
                          className="border p-1 rounded text-black"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t bg-gray-50 text-right sticky bottom-0">
              <button
                onClick={saveHours}
                className="bg-green-600 text-white px-8 py-3 rounded font-bold hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

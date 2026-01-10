"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

// Interfaces
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  image_url?: string;
}
interface Barber {
  id: number;
  name: string;
  photo_url?: string;
}
interface Booking {
  id: number;
  customer_name: string;
  customer_phone: string;
  date_time: string;
  service_id: number;
  service_duration: number;
}
interface Barbershop {
  id: number;
  name: string;
  slug: string;
  hours_config: string;
  logo_url?: string;
}
interface CashEntry {
  id: number;
  description: string;
  value: number;
  date: string;
}

// Configs
type DayConfig = {
  open: string;
  close: string;
  break_start?: string;
  break_end?: string;
  active: boolean;
};
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
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // States Forms
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceImage, setNewServiceImage] = useState("");
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberPhoto, setNewBarberPhoto] = useState("");
  const [cashDesc, setCashDesc] = useState("");
  const [cashValue, setCashValue] = useState("");
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursConfig, setHoursConfig] = useState<WeekConfig>({});
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const getToken = () => localStorage.getItem("barber_token");

  useEffect(() => {
    // Auth Check
    const token = getToken();
    const storedSlug = localStorage.getItem("barber_slug");
    if (!token || storedSlug !== slug) {
      router.push("/login");
      return;
    }

    setShareLink(`${window.location.origin}/${slug}`);

    // Fetch Data (Only GET requests that don't need auth can go without header, but using header everywhere is safer)
    // Actually public endpoints like /barbershops/slug don't need token, but protected actions do.
    const fetchData = async () => {
      try {
        const [resShop, resBookings, resServices, resBarbers, resCash] =
          await Promise.all([
            fetch(`http://127.0.0.1:8000/barbershops/${slug}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/bookings`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/services`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/barbers`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/cash_entries`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
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
        if (resBarbers.ok) setBarbers(await resBarbers.json());
        if (resCash.ok) setCashEntries(await resCash.json());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  // Actions
  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await res.json();
      setUploading(false);
      return d.url;
    } catch {
      setUploading(false);
      return null;
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && shop) {
      const url = await handleUpload(e.target.files[0]);
      if (url) {
        await fetch(`http://127.0.0.1:8000/barbershops/${shop.id}/logo`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ logo_url: url }),
        });
        setShop({ ...shop, logo_url: url });
      }
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
  const handleNewBarberPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      const url = await handleUpload(e.target.files[0]);
      if (url) setNewBarberPhoto(url);
    }
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    const res = await fetch("http://127.0.0.1:8000/barbers/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        name: newBarberName,
        photo_url: newBarberPhoto,
        barbershop_id: shop.id,
      }),
    });
    if (res.ok) {
      const s = await res.json();
      setBarbers([...barbers, s]);
      setNewBarberName("");
      setNewBarberPhoto("");
    }
  };
  const handleDeleteBarber = async (id: number) => {
    if (confirm("Demitir?")) {
      await fetch(`http://127.0.0.1:8000/barbers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setBarbers(barbers.filter((b) => b.id !== id));
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    const res = await fetch("http://127.0.0.1:8000/services/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        name: newServiceName,
        price: parseFloat(newServicePrice),
        duration: parseInt(newServiceDuration),
        barbershop_id: shop.id,
        image_url: newServiceImage,
      }),
    });
    if (res.ok) {
      const s = await res.json();
      setServices([...services, s]);
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceImage("");
    }
  };
  const handleDeleteService = async (id: number) => {
    if (confirm("Excluir?")) {
      await fetch(`http://127.0.0.1:8000/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const saveHours = async () => {
    if (!shop) return;
    await fetch(`http://127.0.0.1:8000/barbershops/${shop.id}/hours`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ hours_config: JSON.stringify(hoursConfig) }),
    });
    setShowHoursModal(false);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHourChange = (d: string, f: keyof DayConfig, v: any) =>
    setHoursConfig((p) => ({ ...p, [d]: { ...p[d], [f]: v } }));

  const handleAddCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch("http://127.0.0.1:8000/cash_entries/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        description: cashDesc,
        value: parseFloat(cashValue),
        date: today,
        barbershop_id: shop.id,
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      setCashEntries([...cashEntries, saved]);
      setCashDesc("");
      setCashValue("");
    }
  };
  const handleDeleteCash = async (id: number) => {
    if (confirm("Apagar?")) {
      const res = await fetch(`http://127.0.0.1:8000/cash_entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setCashEntries(cashEntries.filter((c) => c.id !== id));
    }
  };
  const handleCancelBooking = async (id: number) => {
    if (confirm("Cancelar?")) {
      const res = await fetch(`http://127.0.0.1:8000/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setBookings(bookings.filter((b) => b.id !== id));
    }
  };
  const handleSendReport = async () => {
    if (!confirm("Enviar relatório?")) return;
    const res = await fetch(
      `http://127.0.0.1:8000/barbershops/${slug}/send_report`,
      { method: "POST", headers: { Authorization: `Bearer ${getToken()}` } }
    );
    if (res.ok) alert("Enviado!");
  };

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!shop) return <div className="p-10 text-center">Não encontrado.</div>;

  const servicesMap = services.reduce(
    (acc, s) => ({ ...acc, [s.id]: s }),
    {} as Record<number, Service>
  );
  const totalRevenue =
    bookings.reduce(
      (total, b) => total + (servicesMap[b.service_id]?.price || 0),
      0
    ) + cashEntries.reduce((total, c) => total + c.value, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden border-2 border-blue-500 shrink-0">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.logo_url}
                  alt="Logo"
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
          <div className="flex gap-4">
            <div className="bg-green-50 p-4 rounded border border-green-200 text-center min-w-50 flex flex-col gap-2">
              <div>
                <span className="block text-sm text-green-700 font-bold uppercase">
                  Caixa Total
                </span>
                <span className="block text-3xl font-black text-green-900">
                  R$ {totalRevenue.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleSendReport}
                className="text-xs bg-green-700 text-white py-1 px-2 rounded hover:bg-green-800"
              >
                📧 Enviar Relatório
              </button>
            </div>
            <button
              onClick={logout}
              className="h-fit bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

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
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">
                📅 Agenda (Online)
              </h2>
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                    <tr>
                      <th className="p-4">Horário</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Serviço</th>
                      <th className="p-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {bookings.map((b) => (
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
                        <td className="p-4">
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-red-500 text-xs border border-red-200 bg-red-50 px-2 py-1 rounded"
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">
                💰 Caixa Avulso
              </h2>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <form onSubmit={handleAddCash} className="flex gap-2 mb-4">
                  <input
                    className="flex-1 border p-2 rounded text-sm text-black"
                    placeholder="Descrição"
                    value={cashDesc}
                    onChange={(e) => setCashDesc(e.target.value)}
                    required
                  />
                  <input
                    className="w-24 border p-2 rounded text-sm text-black"
                    type="number"
                    placeholder="R$"
                    step="0.01"
                    value={cashValue}
                    onChange={(e) => setCashValue(e.target.value)}
                    required
                  />
                  <button className="bg-green-600 text-white px-4 rounded font-bold">
                    +
                  </button>
                </form>
                <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {cashEntries.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center py-2 text-sm"
                    >
                      <span className="text-gray-700">
                        {c.description}{" "}
                        <span className="text-xs text-gray-400">
                          ({c.date})
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-700">
                          R$ {c.value.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteCash(c.id)}
                          className="text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">👨‍💈 Equipe</h2>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <form
                  onSubmit={handleAddBarber}
                  className="flex gap-4 items-end mb-6"
                >
                  <div className="relative w-12 h-12 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 shrink-0 overflow-hidden">
                    {newBarberPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={newBarberPhoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs text-gray-400">
                        Foto
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewBarberPhoto}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Nome
                    </label>
                    <input
                      className="w-full border p-2 rounded text-sm text-black"
                      value={newBarberName}
                      onChange={(e) => setNewBarberName(e.target.value)}
                      placeholder="Ex: João"
                      required
                    />
                  </div>
                  <button
                    disabled={uploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm"
                  >
                    Add
                  </button>
                </form>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200 relative group"
                    >
                      <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                        {barber.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={barber.photo_url}
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold text-gray-700 text-sm truncate">
                        {barber.name}
                      </span>
                      <button
                        onClick={() => handleDeleteBarber(barber.id)}
                        className="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white rounded-full p-1 shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">✂️ Serviços</h2>
            <form
              onSubmit={handleAddService}
              className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3"
            >
              <div className="relative w-full h-32 bg-gray-100 rounded border-dashed border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                {newServiceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={newServiceImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Foto</span>
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
                {uploading ? "..." : "+ Cadastrar"}
              </button>
            </form>
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 divide-y divide-gray-100">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-3 hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded shrink-0 overflow-hidden">
                    {s.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.image_url}
                        alt={s.name}
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
                      onClick={() => handleDeleteService(s.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
                  className="flex flex-col justify-between p-3 bg-gray-50 rounded border gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold w-32 text-black">
                      {DAYS_TRANSLATION[day]}
                    </div>
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
                  </div>
                  {hoursConfig[day]?.active && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase font-bold w-12">
                          Turno
                        </span>
                        <input
                          type="time"
                          value={hoursConfig[day]?.open}
                          onChange={(e) =>
                            handleHourChange(day, "open", e.target.value)
                          }
                          className="border p-1 rounded text-black text-sm"
                        />
                        <span className="text-black text-sm">até</span>
                        <input
                          type="time"
                          value={hoursConfig[day]?.close}
                          onChange={(e) =>
                            handleHourChange(day, "close", e.target.value)
                          }
                          className="border p-1 rounded text-black text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase font-bold w-12">
                          Pausa
                        </span>
                        <input
                          type="time"
                          value={hoursConfig[day]?.break_start || ""}
                          onChange={(e) =>
                            handleHourChange(day, "break_start", e.target.value)
                          }
                          className="border p-1 rounded text-black text-sm"
                        />
                        <span className="text-black text-sm">até</span>
                        <input
                          type="time"
                          value={hoursConfig[day]?.break_end || ""}
                          onChange={(e) =>
                            handleHourChange(day, "break_end", e.target.value)
                          }
                          className="border p-1 rounded text-black text-sm"
                        />
                      </div>
                    </div>
                  )}
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

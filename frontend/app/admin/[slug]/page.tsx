/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  barber_id: number;
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

  // States
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms States
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

  // Fetch Data
  useEffect(() => {
    const token = getToken();
    const storedSlug = localStorage.getItem("barber_slug");
    if (!token || storedSlug !== slug) {
      router.push("/login");
      return;
    }
    setShareLink(`${window.location.origin}/${slug}`);

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [resShop, resBookings, resServices, resBarbers, resCash] =
          await Promise.all([
            fetch(`http://127.0.0.1:8000/barbershops/${slug}`, { headers }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/bookings`, {
              headers,
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/services`, {
              headers,
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/barbers`, {
              headers,
            }),
            fetch(`http://127.0.0.1:8000/barbershops/${slug}/cash_entries`, {
              headers,
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
      } catch (e) {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  // Handlers
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
      toast.error("Erro no upload");
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
        toast.success("Logo atualizada!");
      }
    }
  };
  const handleNewServiceImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files?.[0]) {
      const url = await handleUpload(e.target.files[0]);
      if (url) setNewServiceImage(url);
    }
  };
  const handleNewBarberPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
      toast.success("Barbeiro adicionado!");
    }
  };
  const handleDeleteBarber = async (id: number) => {
    if (confirm("Demitir?")) {
      await fetch(`http://127.0.0.1:8000/barbers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setBarbers(barbers.filter((b) => b.id !== id));
      toast.success("Barbeiro removido.");
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
      toast.success("Serviço criado!");
    }
  };
  const handleDeleteService = async (id: number) => {
    if (confirm("Excluir?")) {
      await fetch(`http://127.0.0.1:8000/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setServices(services.filter((s) => s.id !== id));
      toast.success("Serviço removido.");
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
    toast.success("Horários salvos!");
  };
  const handleHourChange = (d: string, f: keyof DayConfig, v: any) =>
    setHoursConfig((p) => ({ ...p, [d]: { ...p[d], [f]: v } }));

  const handleAddCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    const today = new Date().toLocaleDateString("en-CA");
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
      toast.success("Entrada registrada!");
    }
  };
  const handleDeleteCash = async (id: number) => {
    if (confirm("Apagar?")) {
      const res = await fetch(`http://127.0.0.1:8000/cash_entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setCashEntries(cashEntries.filter((c) => c.id !== id));
        toast.success("Entrada removida.");
      }
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (confirm("Cancelar agendamento?")) {
      const res = await fetch(`http://127.0.0.1:8000/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setBookings(bookings.filter((b) => b.id !== id));
        toast.success("Agendamento cancelado.");
      }
    }
  };
  const handleSendReport = async () => {
    if (!confirm("Enviar relatório por e-mail?")) return;
    const res = await fetch(
      `http://127.0.0.1:8000/barbershops/${slug}/send_report`,
      { method: "POST", headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (res.ok) toast.success("Relatório enviado!");
    else toast.error("Erro ao enviar.");
  };
  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">Carregando painel...</div>
    );
  if (!shop)
    return <div className="p-10 text-center">Loja não encontrada.</div>;

  const servicesMap = services.reduce(
    (acc, s) => ({ ...acc, [s.id]: s }),
    {} as Record<number, Service>,
  );

  // Calculations
  const todayStr = new Date().toLocaleDateString("en-CA");
  const dailyBookings = bookings.filter((b) =>
    b.date_time.startsWith(todayStr),
  );
  const dailyCash = cashEntries.filter((c) => c.date === todayStr);

  const bookingsRevenue = dailyBookings.reduce((total, b) => {
    const service = servicesMap[Number(b.service_id)];
    return total + (service ? service.price : 0);
  }, 0);

  const cashRevenue = dailyCash.reduce((total, c) => total + c.value, 0);
  const totalRevenue = bookingsRevenue + cashRevenue;
  const totalForecast =
    bookings.reduce(
      (acc, b) => acc + (servicesMap[Number(b.service_id)]?.price || 0),
      0,
    ) + cashEntries.reduce((acc, c) => acc + c.value, 0);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 pb-20 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="relative w-24 h-24 bg-zinc-100 rounded-full overflow-hidden border-4 border-zinc-900 shadow-md shrink-0 group">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center h-full text-3xl">
                  💈
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Alterar
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase tracking-tight">
                {shop.name}
              </h1>
              <button
                onClick={() => setShowHoursModal(true)}
                className="text-sm text-zinc-500 hover:text-black underline font-bold mt-1"
              >
                ⚙️ Configurar Horários
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-3 md:flex">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center flex-1 min-w-30">
                <span className="block text-[10px] md:text-xs text-green-700 font-bold uppercase">
                  Hoje
                </span>
                <span className="block text-xl md:text-2xl font-black text-green-900">
                  R$ {totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center flex-1 min-w-30">
                <span className="block text-[10px] md:text-xs text-blue-700 font-bold uppercase">
                  Total
                </span>
                <span className="block text-xl md:text-2xl font-black text-blue-900">
                  R$ {totalForecast.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSendReport}
                className="flex-1 bg-zinc-800 text-white py-3 px-4 rounded-lg font-bold text-xs uppercase hover:bg-black transition-colors shadow-sm"
              >
                📧 Relatório
              </button>
              <button
                onClick={logout}
                className="bg-red-100 text-red-600 px-4 py-3 rounded-lg font-bold text-xs uppercase hover:bg-red-200 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* LINK SHARE */}
        <div className="bg-zinc-900 text-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg">📢 Link do Cliente</h3>
            <p className="text-zinc-400 text-sm">Seu site de agendamento:</p>
          </div>
          <div className="flex w-full md:w-auto bg-zinc-800 rounded-lg p-1 border border-zinc-700">
            <input
              readOnly
              value={shareLink}
              className="bg-transparent text-white px-3 py-2 w-full outline-none font-mono text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success("Link copiado!");
              }}
              className="bg-white text-black px-4 py-2 rounded font-bold text-sm uppercase hover:bg-zinc-200"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* AGENDAMENTOS */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                📅 Agenda{" "}
                <span className="bg-zinc-200 text-zinc-600 text-xs px-2 py-1 rounded-full">
                  {bookings.length}
                </span>
              </h2>

              {bookings.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center border border-zinc-200 text-zinc-500">
                  Nenhum agendamento ainda.
                </div>
              ) : (
                <>
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-100 sticky top-0">
                          <tr>
                            <th className="p-4">Horário</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Serviço</th>
                            <th className="p-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-zinc-100">
                          {bookings.map((b) => (
                            <tr
                              key={b.id}
                              className={`hover:bg-zinc-50 transition-colors ${b.date_time.startsWith(todayStr) ? "bg-green-50/50" : ""}`}
                            >
                              <td className="p-4 font-mono font-bold text-zinc-900 whitespace-nowrap">
                                {new Date(b.date_time).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-zinc-900">
                                  {b.customer_name}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {b.customer_phone}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="bg-zinc-100 px-2 py-1 rounded text-xs font-bold text-zinc-700">
                                  {servicesMap[b.service_id]?.name ||
                                    "Excluído"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="text-red-500 text-xs border border-red-200 bg-red-50 px-3 py-1 rounded font-bold hover:bg-red-100 transition-colors"
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

                  {/* MOBILE CARDS */}
                  <div className="md:hidden space-y-3">
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${b.date_time.startsWith(todayStr) ? "border-green-200 bg-green-50/30" : "border-zinc-200"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded font-mono">
                              {new Date(b.date_time).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 font-bold uppercase">
                              {new Date(b.date_time).toLocaleDateString(
                                "pt-BR",
                                {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                          <span className="bg-zinc-100 px-2 py-1 rounded text-[10px] font-bold text-zinc-600 uppercase tracking-wide">
                            {servicesMap[b.service_id]?.name || "Removido"}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-lg">
                            {b.customer_name}
                          </div>
                          <div className="text-sm text-zinc-500 flex items-center gap-1">
                            📱 {b.customer_phone}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="w-full border border-red-200 text-red-600 py-2 rounded-lg font-bold text-xs uppercase hover:bg-red-50 transition-colors"
                        >
                          Cancelar Agendamento
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* CAIXA RAPIDO */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight">
                💰 Caixa Rápido
              </h2>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-zinc-200">
                <form
                  onSubmit={handleAddCash}
                  className="flex flex-col sm:flex-row gap-3 mb-6"
                >
                  <input
                    className="flex-1 border border-zinc-300 p-3 rounded-lg text-sm text-black outline-none focus:border-zinc-900 transition-colors"
                    placeholder="Descrição (Ex: Venda Gel)"
                    value={cashDesc}
                    onChange={(e) => setCashDesc(e.target.value)}
                    required
                  />
                  <div className="flex gap-3">
                    <input
                      className="w-24 border border-zinc-300 p-3 rounded-lg text-sm text-black outline-none focus:border-zinc-900 transition-colors"
                      type="number"
                      placeholder="R$"
                      step="0.01"
                      value={cashValue}
                      onChange={(e) => setCashValue(e.target.value)}
                      required
                    />
                    <button className="bg-green-600 text-white px-6 rounded-lg font-bold text-xl hover:bg-green-700 transition-colors shadow-sm">
                      +
                    </button>
                  </div>
                </form>
                <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                  {cashEntries.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center py-3"
                    >
                      <span className="text-zinc-700 text-sm font-medium">
                        {c.description}{" "}
                        <span className="text-xs text-zinc-400 block sm:inline">
                          ({new Date(c.date).toLocaleDateString()})
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded text-sm">
                          R$ {c.value.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteCash(c.id)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* EQUIPE */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight">
                👨‍💈 Equipe
              </h2>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-zinc-200">
                <form
                  onSubmit={handleAddBarber}
                  className="flex gap-4 items-center mb-6"
                >
                  <div className="relative w-14 h-14 bg-zinc-50 rounded-full border-2 border-dashed border-zinc-300 shrink-0 overflow-hidden hover:border-zinc-500 transition-colors">
                    {newBarberPhoto ? (
                      <img
                        src={newBarberPhoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-[10px] text-zinc-400 uppercase font-bold text-center leading-none">
                        Add
                        <br />
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
                  <div className="flex-1 flex gap-2">
                    <input
                      className="w-full border border-zinc-300 p-3 rounded-lg text-sm text-black outline-none focus:border-zinc-900"
                      value={newBarberName}
                      onChange={(e) => setNewBarberName(e.target.value)}
                      placeholder="Nome do Barbeiro"
                      required
                    />
                    <button
                      disabled={uploading}
                      className="bg-zinc-900 text-white px-5 rounded-lg font-bold hover:bg-black transition-colors"
                    >
                      Ok
                    </button>
                  </div>
                </form>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200 relative group hover:border-zinc-400 transition-all"
                    >
                      <div className="w-10 h-10 bg-zinc-200 rounded-full overflow-hidden shadow-sm">
                        {barber.photo_url ? (
                          <img
                            src={barber.photo_url}
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold text-zinc-700 text-sm truncate">
                        {barber.name}
                      </span>
                      <button
                        onClick={() => handleDeleteBarber(barber.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SERVIÇOS */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight">
              ✂️ Serviços
            </h2>
            <form
              onSubmit={handleAddService}
              className="bg-white p-5 rounded-xl shadow-sm border border-zinc-200 space-y-3"
            >
              <div className="relative w-full h-40 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden hover:border-zinc-500 transition-colors cursor-pointer group">
                {newServiceImage ? (
                  <img
                    src={newServiceImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-2xl">📷</span>
                    <p className="text-xs text-zinc-400 mt-1 uppercase font-bold">
                      Toque para adicionar foto
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewServiceImage}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <input
                className="w-full border border-zinc-300 p-3 rounded-lg text-sm text-black outline-none focus:border-zinc-900"
                placeholder="Nome do Serviço"
                required
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-zinc-400 text-sm">
                    R$
                  </span>
                  <input
                    className="w-full border border-zinc-300 p-3 pl-9 rounded-lg text-sm text-black outline-none focus:border-zinc-900"
                    type="number"
                    placeholder="0.00"
                    required
                    step="0.01"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                  />
                </div>
                <div className="relative w-24">
                  <input
                    className="w-full border border-zinc-300 p-3 rounded-lg text-sm text-black outline-none focus:border-zinc-900 text-center"
                    type="number"
                    placeholder="Min"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                  />
                  <span className="absolute right-2 top-3.5 text-[10px] text-zinc-400 uppercase font-bold pointer-events-none">
                    Min
                  </span>
                </div>
              </div>
              <button
                disabled={uploading}
                className="w-full bg-zinc-900 text-white py-3 rounded-lg font-bold hover:bg-black uppercase tracking-wide text-sm shadow-md transition-transform active:scale-95"
              >
                {uploading ? "Salvando..." : "Cadastrar Serviço"}
              </button>
            </form>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 divide-y divide-zinc-100">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors relative group"
                >
                  <div className="w-14 h-14 bg-zinc-100 rounded-lg shrink-0 overflow-hidden border border-zinc-100">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-zinc-800">{s.name}</div>
                    <div className="text-xs text-zinc-500 font-medium mt-1">
                      R$ {s.price.toFixed(2)} • {s.duration} min
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- CORREÇÃO DO MODAL DE HORÁRIOS AQUI --- */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          {/* Adicionado max-h-[90vh] e flex flex-col para travar altura e forçar scroll interno */}
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho Fixo */}
            <div className="p-6 border-b flex justify-between items-center bg-white shrink-0 z-10">
              <h2 className="text-xl font-bold text-zinc-900">
                Configurar Horários
              </h2>
              <button
                onClick={() => setShowHoursModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-red-100 text-zinc-500 hover:text-red-500 flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            {/* Corpo com Scroll (overflow-y-auto) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50 custom-scrollbar">
              {DAYS_ORDER.map((day) => (
                <div
                  key={day}
                  className={`flex flex-col p-4 rounded-xl border transition-all ${hoursConfig[day]?.active ? "bg-white border-zinc-300 shadow-sm" : "bg-zinc-100 border-transparent opacity-70"}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-zinc-900 uppercase tracking-wide text-sm">
                      {DAYS_TRANSLATION[day]}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={hoursConfig[day]?.active || false}
                        onChange={(e) =>
                          handleHourChange(day, "active", e.target.checked)
                        }
                      />
                      <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {hoursConfig[day]?.active && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                          Funcionamento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={hoursConfig[day]?.open}
                            onChange={(e) =>
                              handleHourChange(day, "open", e.target.value)
                            }
                            className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded text-sm text-center font-mono focus:border-black outline-none"
                          />
                          <input
                            type="time"
                            value={hoursConfig[day]?.close}
                            onChange={(e) =>
                              handleHourChange(day, "close", e.target.value)
                            }
                            className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded text-sm text-center font-mono focus:border-black outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                          Intervalo (Opcional)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={hoursConfig[day]?.break_start || ""}
                            onChange={(e) =>
                              handleHourChange(
                                day,
                                "break_start",
                                e.target.value,
                              )
                            }
                            className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded text-sm text-center font-mono focus:border-black outline-none"
                          />
                          <input
                            type="time"
                            value={hoursConfig[day]?.break_end || ""}
                            onChange={(e) =>
                              handleHourChange(day, "break_end", e.target.value)
                            }
                            className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded text-sm text-center font-mono focus:border-black outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rodapé Fixo */}
            <div className="p-4 sm:p-6 border-t bg-white shrink-0">
              <button
                onClick={saveHours}
                className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-transform active:scale-95 shadow-lg"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

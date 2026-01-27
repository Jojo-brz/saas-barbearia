import Link from "next/link";
import ServiceList from "../../src/components/ServerLIst";

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
interface Barbershop {
  id: number;
  name: string;
  slug: string;
  address?: string;
  hours_config: string;
  logo_url?: string;
}
type DayConfig = { open: string; close: string; active: boolean };
type WeekConfig = Record<string, DayConfig>;
const DAYS_TRANSLATION: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};
const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

async function getBarbershop(slug: string): Promise<Barbershop | null> {
  const res = await fetch(`http://127.0.0.1:8000/barbershops/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
async function getServices(slug: string): Promise<Service[]> {
  const res = await fetch(
    `http://127.0.0.1:8000/barbershops/${slug}/services`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}
async function getBarbers(slug: string): Promise<Barber[]> {
  const res = await fetch(`http://127.0.0.1:8000/barbershops/${slug}/barbers`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function BarbershopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getBarbershop(slug);
  const services = await getServices(slug);
  const barbers = await getBarbers(slug);
  if (!shop)
    return <div className="p-10 text-center">Barbearia não encontrada.</div>;

  let hours: WeekConfig = {};
  try {
    hours = JSON.parse(shop.hours_config);
  } catch {}
  const todayEnglish = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      {/* HEADER PRETO/ZINC */}
      <header className="bg-zinc-950 text-white py-12 px-6 shadow-xl border-b border-zinc-800">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-white rounded-full p-1 shadow-2xl mb-4 overflow-hidden border-4 border-zinc-800">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-3xl font-bold">
                {shop.name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">
            {shop.name}
          </h1>
          {shop.address && (
            <p className="text-zinc-400 font-medium">📍 {shop.address}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 -mt-8 flex-1 w-full z-10 relative">
        {/* HORÁRIOS */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-zinc-100">
          <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-2 uppercase tracking-wide">
            🕒 Horários
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {DAYS_ORDER.map((day) => {
              const config = hours[day];
              const isToday = day === todayEnglish;
              return (
                <div
                  key={day}
                  className={`flex justify-between items-center py-1 px-2 rounded ${isToday ? "bg-zinc-900 text-white font-bold" : "text-zinc-500"}`}
                >
                  <span>{DAYS_TRANSLATION[day]}</span>
                  <span>
                    {config?.active ? (
                      `${config.open} - ${config.close}`
                    ) : (
                      <span className="text-red-400 text-xs uppercase font-bold">
                        Fechado
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* EQUIPE */}
        {barbers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              👨‍💈 Nossa Equipe
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className="flex flex-col items-center min-w-25"
                >
                  <div className="w-20 h-20 rounded-full bg-zinc-200 mb-2 overflow-hidden border-2 border-zinc-900 shadow-md">
                    {barber.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={barber.photo_url}
                        alt={barber.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        😎
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-zinc-800">
                    {barber.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTA DE SERVIÇOS */}
        <h2 className="text-2xl font-black text-zinc-900 mb-6 border-b border-zinc-200 pb-2 flex items-center gap-2 uppercase tracking-tight">
          ✂️ Escolha seu Serviço
        </h2>
        <ServiceList services={services} shop={shop} />

        <div className="mt-12 text-center pb-10">
          <Link
            href="/"
            className="text-zinc-400 hover:text-black text-sm font-bold transition-colors"
          >
            ← Voltar para Início
          </Link>
        </div>
      </main>

      <footer className="bg-white py-8 text-center text-zinc-400 text-xs mt-auto border-t border-zinc-100">
        <p className="font-medium">
          &copy; {new Date().getFullYear()} {shop.name}
        </p>
        <p className="mt-2">
          Sistema desenvolvido por{" "}
          <span className="text-zinc-900 font-bold">BarberSaaS</span>.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 opacity-20 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
          title="Acesso Restrito"
        >
          🔒
        </Link>
      </footer>
    </div>
  );
}

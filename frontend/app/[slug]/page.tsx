import Link from "next/link";
import ServiceList from "../../src/components/ServerLIst";

// Tipos
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface Barbershop {
  id: number;
  name: string;
  slug: string;
  address?: string;
  hours_config: string; // JSON String
  logo_url?: string;
}

// Estrutura do JSON de Horários
type DayConfig = { open: string; close: string; active: boolean };
type WeekConfig = Record<string, DayConfig>;

// Tradução para exibir na tela
const DAYS_TRANSLATION: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};
// Ordem correta para exibição
const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Funções de Busca
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
    { cache: "no-store" }
  );
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

  if (!shop)
    return <div className="p-10 text-center">Barbearia não encontrada.</div>;

  // Processa os horários (Parse do JSON)
  let hours: WeekConfig = {};
  try {
    hours = JSON.parse(shop.hours_config);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Se der erro ou estiver vazio, ignora
  }

  // Pega o dia de hoje para destacar na lista
  const todayEnglish = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER COM LOGO E CAPA */}
      <header className="bg-blue-900 text-white py-10 px-6 shadow-lg">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          {/* LOGO REDONDA */}
          <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl mb-4 overflow-hidden">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-bold">
                {shop.name.charAt(0)}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            {shop.name}
          </h1>
          {shop.address && <p className="text-blue-200">📍 {shop.address}</p>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 -mt-8">
        {/* --- CARD DE HORÁRIOS (NOVO!) --- */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            🕒 Horários de Atendimento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {DAYS_ORDER.map((day) => {
              const config = hours[day];
              const isToday = day === todayEnglish;

              return (
                <div
                  key={day}
                  className={`flex justify-between items-center py-1 px-2 rounded ${
                    isToday
                      ? "bg-blue-50 font-bold text-blue-800"
                      : "text-gray-600"
                  }`}
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

        {/* --- LISTA DE SERVIÇOS --- */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
          ✂️ Escolha seu Serviço
        </h2>

        <ServiceList services={services} shop={shop} />

        <div className="mt-12 text-center pb-10">
          <Link
            href="/"
            className="text-gray-400 hover:text-blue-600 text-sm font-bold transition-colors"
          >
            ← Voltar para Início
          </Link>
        </div>
      </main>
    </div>
  );
}

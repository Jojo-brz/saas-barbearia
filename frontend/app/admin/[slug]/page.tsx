import Link from "next/link";

// Tipos atualizados
interface Service {
  id: number;
  name: string;
  price: number;
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
}

// 1. Busca Agendamentos
async function getBookings(slug: string): Promise<Booking[]> {
  const res = await fetch(
    `http://127.0.0.1:8000/barbershops/${slug}/bookings`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const bookings: Booking[] = await res.json();
  // Ordena do mais recente para o antigo
  return bookings.sort(
    (a, b) =>
      new Date(b.date_time).getTime() - a.date_time.localeCompare(b.date_time)
  );
}

// 2. Busca Serviços (Para sabermos o nome e preço de cada ID)
async function getServices(slug: string): Promise<Service[]> {
  const res = await fetch(
    `http://127.0.0.1:8000/barbershops/${slug}/services`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

// 3. Busca Informações da Loja
async function getBarbershop(slug: string): Promise<Barbershop | null> {
  const res = await fetch(`http://127.0.0.1:8000/barbershops/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Executa as 3 buscas ao mesmo tempo (mais rápido)
  const [bookings, services, shop] = await Promise.all([
    getBookings(slug),
    getServices(slug),
    getBarbershop(slug),
  ]);

  if (!shop)
    return <div className="p-10 text-red-500">Barbearia não encontrada.</div>;

  // --- LÓGICA DE FATURAMENTO ---
  // Criamos um "Mapa" para achar o serviço pelo ID rapidamente
  // Ex: { 1: {name: "Corte", price: 30}, 2: {name: "Barba", price: 20} }
  const servicesMap = services.reduce((acc, service) => {
    acc[service.id] = service;
    return acc;
  }, {} as Record<number, Service>);

  // Calculamos o total somando o preço de cada agendamento
  const totalRevenue = bookings.reduce((total, booking) => {
    const service = servicesMap[booking.service_id];
    return total + (service ? service.price : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Painel do Barbeiro
            </h1>
            <p className="text-gray-500">
              Gerenciando:{" "}
              <span className="font-semibold text-blue-600">{shop.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-green-100 px-4 py-2 rounded-lg border border-green-200">
              <span className="text-sm text-green-700 font-bold block">
                Faturamento Total
              </span>
              <span className="text-xl text-green-800 font-bold">
                R$ {totalRevenue.toFixed(2)}
              </span>
            </div>
            <Link
              href={`/${slug}`}
              target="_blank"
              className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors font-bold text-sm"
            >
              Ver Loja &rarr;
            </Link>
          </div>
        </div>

        {/* Tabela de Agendamentos */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-4">Data e Hora</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Serviço</th>
                <th className="p-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-500 italic"
                  >
                    Nenhum agendamento encontrado para esta barbearia.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const service = servicesMap[booking.service_id];
                  const dateObj = new Date(booking.date_time);
                  const formattedDate = dateObj.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-blue-700 font-bold">
                        {formattedDate}
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {booking.customer_name}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {booking.customer_phone}
                      </td>
                      <td className="p-4 text-gray-700">
                        {service ? (
                          <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                            {service.name}
                          </span>
                        ) : (
                          <span className="text-red-400 text-sm">
                            Serviço excluído ({booking.service_id})
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-green-600">
                        {service ? `R$ ${service.price.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Atualize a página para ver novos agendamentos.
        </p>
      </div>
    </div>
  );
}

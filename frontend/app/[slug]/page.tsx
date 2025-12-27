import Link from "next/link";

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
}

// Buscar dados da Barbearia
async function getBarbershop(slug: string): Promise<Barbershop | null> {
  const res = await fetch(`http://127.0.0.1:8000/barbershops/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

// Buscar serviços da Barbearia
async function getServices(slug: string): Promise<Service[]> {
  const res = await fetch(
    `http://127.0.0.1:8000/barbershops/${slug}/services`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function BarbershopPage({
  params,
}: {
  // MUDANÇA 1: Avisamos que params é uma Promessa
  params: Promise<{ slug: string }>;
}) {
  // MUDANÇA 2: Esperamos a promessa resolver para pegar o slug
  const { slug } = await params;

  // Agora usamos a variável 'slug' limpa
  const shop = await getBarbershop(slug);
  const services: Service[] = await getServices(slug);

  if (!shop) return <div>Barbearia não encontrada.</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-900 text-white py-10 px-6 text-center">
        <h1 className="text-4xl font-bold">{shop.name}</h1>
        {shop.address && (
          <p className="mt-2 text-blue-200">📍 {shop.address}</p>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Nossos Serviços
        </h2>

        <div className="flex flex-col gap-4">
          {services.length === 0 ? (
            <p className="text-gray-500 italic">
              Nenhum serviço cadastrado ainda.
            </p>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border hover:border-blue-500 cursor-pointer group"
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ⏱ {service.duration} min
                  </p>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-blue-600 text-lg">
                    R$ {service.price.toFixed(2)}
                  </span>
                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Reservar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Voltar
          </Link>
        </div>
      </main>
    </div>
  );
}

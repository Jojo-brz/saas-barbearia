import Link from "next/link";
import ServiceList from "../../src/components/ServerLIst"; // <--- Importamos o novo componente

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

// Funções de busca (Fetch)
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

        {/* Aqui substituímos todo aquele código antigo pelo nosso componente */}
        <ServiceList services={services} barbershopId={shop.id} />

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Voltar
          </Link>
        </div>
      </main>
    </div>
  );
}

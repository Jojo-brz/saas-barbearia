import BarbershopForm from "../src/components/BarbershopForm";
import Link from "next/link";

// 1. Definimos o tipo de dado que virá do Python
interface Barbershop {
  id: number;
  name: string;
  slug: string;
  address?: string;
}

// 2. Função para buscar dados na API (Back-end)
async function getBarbershops() {
  try {
    const res = await fetch("http://127.0.0.1:8000/barbershops/", {
      cache: "no-store", // Sempre pegar dados novos
    });
    return res.json();
  } catch (error) {
    console.error("Erro ao buscar API:", error);
    return [];
  }
}

// 3. O Componente da Página
export default async function Home() {
  const barbershops: Barbershop[] = await getBarbershops();

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-blue-900">Barber SaaS</h1>
          <p className="text-gray-600 mt-2">
            Plataforma de gestão para barbearias
          </p>
        </header>

        <BarbershopForm />

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Barbearias Parceiras
        </h2>

        {/* Grid de Cartões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {barbershops.map((shop) => (
            <Link href={`/${shop.slug}`} key={shop.id} className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group-hover:border-blue-500 group-hover:shadow-md transition-all">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600">
                  {shop.name}
                </h3>
                <p className="text-blue-500 text-sm font-mono mb-4">
                  /{shop.slug}
                </p>

                {shop.address && (
                  <p className="text-gray-500 text-sm mb-4">
                    📍 {shop.address}
                  </p>
                )}

                <span className="text-blue-600 text-sm font-semibold group-hover:underline">
                  Acessar Página &rarr;
                </span>
              </div>
            </Link>
          ))}

          {barbershops.length === 0 && (
            <div className="text-center col-span-2 text-gray-500 p-10 bg-white rounded-lg">
              <p>Nenhuma barbearia encontrada.</p>
              <p className="text-sm mt-2">
                Verifique se o Backend (Python) está rodando.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

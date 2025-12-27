import Link from "next/link";

// Tipos
interface Barbershop {
  id: number;
  name: string;
  slug: string;
}

// Busca as barbearias apenas para mostrar que a plataforma está viva
async function getBarbershops() {
  try {
    const res = await fetch("http://127.0.0.1:8000/barbershops/", {
      cache: "no-store",
    });
    return res.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const barbershops: Barbershop[] = await getBarbershops();

  return (
    <div className="min-h-screen bg-white">
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-black text-blue-900 tracking-tighter">
          BARBER<span className="text-blue-500">SAAS</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-gray-600 font-bold hover:text-blue-600 py-2"
          >
            Área do Cliente (Login)
          </Link>
          {/* Botão agora leva para contato, não para cadastro */}
          <Link
            href="https://wa.me/5500000000000" // Coloque seu WhatsApp aqui
            className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition-all"
          >
            Contratar Sistema
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="text-center py-20 px-4 bg-linear-to-b from-white to-blue-50">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          A revolução na gestão da <br />
          <span className="text-blue-600">sua barbearia.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Sistema completo de agendamento, financeiro e site exclusivo. Entre em
          contato e digitalize seu negócio hoje mesmo.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="https://wa.me/5500000000000" // Seu WhatsApp
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            Falar com Consultor
          </Link>
        </div>
      </header>

      {/* --- VITRINE (Ainda mostramos quem usa para dar credibilidade) --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              Quem já usa o BarberSaaS
            </h2>
            <p className="text-gray-600">
              Junte-se às melhores barbearias da região.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barbershops.map((shop) => (
              <Link
                href={`/${shop.slug}`}
                key={shop.id}
                className="bg-white p-4 rounded shadow-sm hover:shadow-md hover:border-blue-500 border border-transparent transition-all group"
              >
                <div className="font-bold text-gray-800 group-hover:text-blue-600 truncate">
                  {shop.name}
                </div>
                <div className="text-xs text-gray-400">/{shop.slug}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white py-10 text-center">
        <p className="opacity-50">
          © 2025 BarberSaaS - Todos os direitos reservados
        </p>
        <Link
          href="/super-admin"
          className="text-xs text-gray-700 hover:text-gray-500 mt-4 block"
        >
          Acesso Restrito
        </Link>
      </footer>
    </div>
  );
}

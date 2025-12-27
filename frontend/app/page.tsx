import BarbershopForm from "../src/components/BarbershopForm";
import Link from "next/link";

interface Barbershop {
  id: number;
  name: string;
  slug: string;
}

async function getBarbershops() {
  try {
    const res = await fetch("http://127.0.0.1:8000/barbershops/", {
      cache: "no-store",
    });
    return res.json();
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
            Sou Barbeiro (Login)
          </Link>
          <Link
            href="#cadastro"
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all"
          >
            Começar Grátis
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION (A promessa) --- */}
      <header className="text-center py-20 px-4 bg-gradient-to-b from-white to-blue-50">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          A revolução na gestão da <br />
          <span className="text-blue-600">sua barbearia.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Chega de agendar pelo WhatsApp. Tenha um site próprio, controle
          financeiro e agenda automática em menos de 2 minutos.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="#cadastro"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            Criar Minha Barbearia Agora
          </Link>
          <Link
            href="/super-admin"
            className="px-8 py-4 rounded-lg font-bold text-gray-500 hover:text-gray-800"
          >
            Acesso Super Admin (Demo)
          </Link>
        </div>
      </header>

      {/* --- FEATURES (Benefícios) --- */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 border rounded-xl hover:shadow-md transition-all">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Agenda 24h</h3>
            <p className="text-gray-600">
              Seu cliente agenda horário mesmo quando você está dormindo.
            </p>
          </div>
          <div className="p-6 border rounded-xl hover:shadow-md transition-all">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Controle Financeiro
            </h3>
            <p className="text-gray-600">
              Saiba exatamente quanto faturou no dia, semana e mês.
            </p>
          </div>
          <div className="p-6 border rounded-xl hover:shadow-md transition-all">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Site Exclusivo
            </h3>
            <p className="text-gray-600">
              Ganhamos um link personalizado (seusite.com/sualoja).
            </p>
          </div>
        </div>
      </section>

      {/* --- CADASTRO E DEMO --- */}
      <section id="cadastro" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              Experimente agora
            </h2>
            <p className="text-gray-600">
              Crie uma barbearia de teste e veja a mágica acontecer.
            </p>
          </div>

          {/* O Formulário que criamos antes */}
          <BarbershopForm />

          {/* Lista de Barbearias Criadas (Para facilitar o teste) */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              🏢 Barbearias Recentes na Plataforma
            </h3>
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
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white py-10 text-center">
        <p className="opacity-50">© 2025 BarberSaaS - Desenvolvido por Você</p>
      </footer>
    </div>
  );
}

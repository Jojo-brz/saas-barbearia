import Link from "next/link";
import { ArrowRight, Scissors, CalendarCheck, TrendingUp } from "lucide-react";

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
    // Fundo totalmente escuro
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-cyan-500/30 text-zinc-100">
      {/* --- NAVBAR (Ajustada para Mobile) --- */}
      <nav className="flex flex-col md:flex-row justify-between items-center p-6 md:px-8 max-w-6xl mx-auto gap-5 md:gap-0">
        <div className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
          <Scissors className="w-6 h-6 text-cyan-500" />
          BARBER<span className="text-cyan-500">SAAS</span>
        </div>

        {/* Container dos botões: Ocupa toda a largura no mobile e centraliza */}
        <div className="flex items-center justify-center gap-6 w-full md:w-auto">
          <Link
            href="/login"
            className="text-zinc-400 font-semibold hover:text-white transition-colors text-sm md:text-base"
          >
            Entrar
          </Link>
          <Link
            href="https://wa.me/5553999078299"
            className="bg-white text-zinc-950 px-6 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-all text-sm shadow-md"
          >
            Seja Parceiro
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative text-center pt-12 pb-24 md:pt-24 md:pb-32 px-6 overflow-hidden">
        {/* Efeito de luz ao fundo estilo Neon */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-75 h-75 md:w-150 md:h-100 bg-cyan-600/20 blur-[100px] rounded-full -z-10"></div>

        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 font-medium text-xs md:text-sm mb-10 border border-cyan-500/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Lançamento exclusivo para barbeiros visionários!
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.15]">
            O futuro da gestão de barbearias,
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
              <br />
              NA PALMA DA SUA MÃO.
            </span>
          </h1>
          <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed px-2 md:px-0">
            Abandone o papel. Controle agendamentos, envie lembretes automáticos
            e feche o caixa do dia pelo celular com um sistema feito para
            barbeiros.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-2 md:px-0">
            <Link
              href="https://wa.me/5553999078299"
              className="flex w-full sm:w-auto items-center justify-center gap-2 bg-cyan-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-cyan-500 shadow-xl shadow-cyan-900/30 transition-all hover:-translate-y-1"
            >
              Garantir Plano Fundador
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* --- VITRINE / QUEM USA --- */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Barbearias de Elite
            </h2>
            <p className="text-zinc-400 text-lg px-4">
              Conheça quem já modernizou o atendimento com o BarberSaaS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {barbershops.length > 0 ? (
              barbershops.map((shop) => (
                <Link
                  href={`/${shop.slug}`}
                  key={shop.id}
                  className="group bg-zinc-900/50 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-cyan-900/20 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700 group-hover:bg-cyan-600 group-hover:border-cyan-500 transition-colors">
                    <Scissors className="w-6 h-6 text-zinc-300 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {shop.name}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500">
                    barbersaas.com/{shop.slug}
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center text-zinc-600 py-10">
                Seja a primeira barbearia a aparecer aqui!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-zinc-950 text-zinc-500 py-12 text-center border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-300 font-bold">
            <Scissors className="w-5 h-5" /> BARBERSAAS
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Desenvolvido em Pelotas/RS. Todos os
            direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

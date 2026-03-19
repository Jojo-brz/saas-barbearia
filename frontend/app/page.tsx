"use client";
import { useRouter } from "next/navigation";
import {
  Scissors,
  CalendarDays,
  TrendingUp,
  Smartphone,
  ArrowRight,
  Star,
} from "lucide-react";

export default function SaaSLandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <CalendarDays size={24} className="text-amber-500" />,
      title: "Agenda Inteligente",
      description:
        "Acabe com os buracos na agenda. Os seus clientes marcam sozinhos 24h por dia, sem precisar de lhe mandar mensagem.",
    },
    {
      icon: <TrendingUp size={24} className="text-amber-500" />,
      title: "Gestão Financeira",
      description:
        "Saiba exatamente quanto a barbearia faturou no dia e calcule a comissão de cada barbeiro com um clique.",
    },
    {
      icon: <Smartphone size={24} className="text-amber-500" />,
      title: "Link Exclusivo",
      description:
        "Tenha um site próprio (ex: app.com/sua-barbearia) com o seu logótipo, portfólio e equipa para enviar aos clientes.",
    },
    {
      icon: <Scissors size={24} className="text-amber-500" />,
      title: "PDV para Barbeiros",
      description:
        "Cada barbeiro acede à própria agenda pelo tablet da loja usando apenas um PIN de 4 dígitos. Rápido e seguro.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-black">
      {/* NAVEGAÇÃO */}
      <nav className="fixed top-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-2 rounded-xl">
              <Scissors size={24} className="text-black" />
            </div>
            <span className="text-xl font-black tracking-widest uppercase">
              Barber<span className="text-amber-500">SaaS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-zinc-400">
            <a
              href="#funcionalidades"
              className="hover:text-white transition-colors"
            >
              Funcionalidades
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="hidden md:block text-sm font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => router.push("/login")}
              className="bg-amber-500 text-black px-5 py-2.5 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-400 hover:scale-105 transition-all active:scale-95"
            >
              Aceder ao Painel
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (Abertura) */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
        {/* Efeito de brilho de fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-150 h-150 bg-amber-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-500 text-xs font-bold tracking-widest uppercase mb-8">
            <Star size={14} className="fill-amber-500" /> O melhor sistema para
            barbearias
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8">
            Domine a sua barbearia. <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600">
              Escale os seus lucros.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Esqueça o papel e a caneta. Ofereça uma experiência premium aos seus
            clientes e tenha o controlo total da agenda, equipa e finanças na
            palma da sua mão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.open("https://wa.me/53999078299", "_blank")}
              className="w-full sm:w-auto bg-amber-500 text-black px-8 py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95"
            >
              Criar a Minha Conta <ArrowRight size={20} />
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-zinc-800 transition-all active:scale-95"
            >
              Já sou cliente
            </button>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section
        id="funcionalidades"
        className="py-24 bg-zinc-900/50 border-y border-zinc-800/50"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Tudo o que precisa num só lugar
            </h2>
            <p className="text-zinc-400">
              Feito de barbeiros para barbeiros. Simples, rápido e sem
              complicações.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl hover:border-amber-500/50 transition-colors group"
              >
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-linear-to-br from-amber-500 to-amber-700 rounded-[40px] p-10 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

          <h2 className="text-3xl md:text-5xl font-black text-black mb-6 relative z-10">
            Pronto para lotar a sua agenda?
          </h2>
          <p className="text-black/80 font-bold text-lg mb-10 max-w-xl mx-auto relative z-10">
            Junte-se a dezenas de barbearias que já modernizaram o seu
            atendimento e aumentaram o seu faturamento.
          </p>
          <button
            onClick={() =>
              window.open("https://wa.me/SEU_NUMERO_AQUI", "_blank")
            }
            className="bg-black text-amber-500 px-10 py-5 rounded-2xl text-lg font-black hover:bg-zinc-900 transition-all hover:scale-105 active:scale-95 shadow-2xl relative z-10"
          >
            Falar com um Consultor
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Scissors size={20} className="text-amber-500" />
          <span className="text-lg font-black tracking-widest uppercase">
            Barber<span className="text-amber-500">SaaS</span>
          </span>
        </div>
        <p className="text-zinc-600 text-sm mb-6">
          © {new Date().getFullYear()} BarberSaaS. Todos os direitos reservados.
        </p>

        {/* Link secreto para o painel do SuperAdmin/CEO */}
        <button
          onClick={() => router.push("/superadmin/login")}
          className="text-[10px] text-zinc-800 hover:text-zinc-600 uppercase font-black tracking-widest transition-colors"
        >
          Acesso Restrito
        </button>
      </footer>
    </div>
  );
}

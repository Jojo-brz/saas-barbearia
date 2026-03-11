"use client";
import React, { useState } from "react";
import {
  Scissors,
  MapPin,
  Instagram,
  Calendar as CalendarIcon,
  ChevronLeft,
  CheckCircle2,
  User,
  Clock,
  X,
} from "lucide-react";

export default function TelaDoClienteDemo() {
  // === ESTADOS DO MODAL E AGENDAMENTO ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // === DADOS MOCK (Simulação) ===
  const barbeariaInfo = {
    nome: "Barbearia Vintage",
    descricao:
      "A união perfeita entre o clássico e o contemporâneo. Um espaço pensado para o homem moderno que valoriza um serviço de excelência, ambiente sofisticado e, claro, uma boa cerveja gelada.",
    endereco: "Av. Bento Gonçalves, 123 - Centro, Pelotas - RS",
    instagram: "@vintagebarbearia",
  };

  const portfolio = [
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1593060686940-b4f0b22a0097?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=500&q=80",
  ];

  const barbeiros = [
    {
      id: 1,
      name: "Otávio (CEO)",
      especialidade: "Corte em Degradê",
      avatar: "O",
    },
    { id: 2, name: "Tom", especialidade: "Barba Clássica", avatar: "T" },
    { id: 3, name: "Lucas", especialidade: "Tesoura", avatar: "L" },
    { id: 4, name: "Mateus", especialidade: "Platinado", avatar: "M" },
  ];

  const servicos = [
    { id: 1, name: "Corte Clássico", price: 50, duration: "45 min" },
    { id: 2, name: "Barba Terapia", price: 35, duration: "30 min" },
    { id: 3, name: "Corte + Barba VIP", price: 80, duration: "1h 15m" },
  ];

  const dias = ["Hoje, 15", "Amanhã, 16", "Sexta, 17", "Sábado, 18"];
  const horarios = [
    { time: "09:00", available: true },
    { time: "09:45", available: false },
    { time: "10:30", available: true },
    { time: "11:15", available: true },
    { time: "14:00", available: true },
    { time: "14:45", available: false },
    { time: "15:30", available: true },
  ];

  // === FUNÇÕES DE CONTROLO DO MODAL ===
  const abrirModal = () => setIsModalOpen(true);

  const fecharModal = () => {
    setIsModalOpen(false);
    // Reinicia o processo caso o cliente desista a meio
    setTimeout(() => {
      setStep(1);
      setSelectedService(null);
      setSelectedBarber(null);
      setSelectedDate(null);
      setSelectedTime(null);
    }, 300);
  };

  const handleAvancar = () => {
    if (step < 4) setStep(step + 1);
  };
  const handleVoltar = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmar = () => {
    alert("Agendamento concluído com sucesso!");
    fecharModal();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
      {/* =========================================
          PÁGINA PRINCIPAL (LANDING PAGE)
      ========================================= */}
      <div
        className={`max-w-2xl mx-auto bg-zinc-950 min-h-screen border-x border-zinc-900 pb-24 relative shadow-2xl transition-all duration-500 ${isModalOpen ? "scale-95 opacity-50 blur-sm overflow-hidden" : "scale-100 opacity-100"}`}
      >
        {/* Cabeçalho */}
        <div className="pt-12 pb-8 px-6 border-b border-zinc-900 bg-black">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-lg shrink-0">
              <Scissors className="w-8 h-8 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">
                {barbeariaInfo.nome}
              </h1>
              <p className="text-zinc-400 text-sm flex items-center gap-1 mt-1.5">
                <MapPin className="w-3.5 h-3.5" /> {barbeariaInfo.endereco}
              </p>
            </div>
          </div>
        </div>

        {/* Descrição Minimalista */}
        <div className="px-6 py-8">
          <p className="text-zinc-400 text-[15px] leading-relaxed font-light">
            {barbeariaInfo.descricao}
          </p>
        </div>

        {/* Botão de Agendar (Abre o Modal) */}
        <div className="px-6 mb-10">
          <button
            onClick={abrirModal}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CalendarIcon className="w-5 h-5" />
            Agendar Horário
          </button>
        </div>

        {/* Portfólio */}
        <div className="mb-10">
          <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-lg font-bold text-white">O Nosso Trabalho</h2>
            <span className="text-xs text-zinc-500 font-medium">
              Arraste para o lado
            </span>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x snap-mandatory no-scrollbar">
            {portfolio.map((img, i) => (
              <div
                key={i}
                className="shrink-0 w-[45%] sm:w-[40%] aspect-4/5 rounded-2xl overflow-hidden snap-center border border-zinc-800"
              >
                <img
                  src={img}
                  alt={`Corte ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Equipa */}
        <div className="px-6 mb-12">
          <h2 className="text-lg font-bold text-white mb-4">
            Os Nossos Profissionais
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {barbeiros.map((barber) => (
              <div
                key={barber.id}
                className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 mb-3 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-black text-zinc-400 border border-zinc-700 group-hover:border-cyan-500/50 transition-colors">
                  {barber.avatar}
                </div>
                <h3 className="font-bold text-white text-sm">{barber.name}</h3>
                <p className="text-zinc-500 text-[11px] mt-0.5 uppercase tracking-wider font-semibold">
                  {barber.especialidade}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-8 border-t border-zinc-900 bg-black text-center space-y-4">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-cyan-500 transition-colors text-sm font-medium"
          >
            <Instagram className="w-4 h-4" /> {barbeariaInfo.instagram}
          </a>
          <p className="text-zinc-600 text-xs">{barbeariaInfo.endereco}</p>
        </div>
      </div>

      {/* =========================================
          MODAL DE AGENDAMENTO (WIZARD)
      ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
          <div className="w-full max-w-2xl bg-zinc-950 sm:rounded-3xl h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl border-t sm:border border-zinc-800 animate-slide-up sm:animate-fade-in-up rounded-t-3xl overflow-hidden relative">
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-900 bg-black/50 z-10">
              <div className="flex items-center gap-3">
                {step > 1 ? (
                  <button
                    onClick={handleVoltar}
                    className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-9 h-9" /> // Espaçador para manter o alinhamento
                )}
                <div>
                  <h2 className="text-lg font-bold text-white leading-none">
                    Agendamento
                  </h2>
                  <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mt-1">
                    Passo {step} de 4
                  </p>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-red-500/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Rolável do Modal */}
            <div className="p-6 overflow-y-auto pb-32 flex-1 custom-scrollbar">
              {/* Etapa 1: Serviços */}
              {step === 1 && (
                <div className="animate-fade-in-right">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-zinc-500" /> Escolha o
                    Serviço
                  </h3>
                  <div className="space-y-3">
                    {servicos.map((svc) => (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${selectedService?.id === svc.id ? "bg-cyan-500/10 border-cyan-500" : "bg-zinc-900 border-zinc-800"}`}
                      >
                        <div>
                          <h4
                            className={`font-bold ${selectedService?.id === svc.id ? "text-cyan-400" : "text-white"}`}
                          >
                            {svc.name}
                          </h4>
                          <p className="text-zinc-500 text-sm mt-1">
                            {svc.duration}
                          </p>
                        </div>
                        <span className="font-black text-white">
                          R$ {svc.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etapa 2: Profissionais */}
              {step === 2 && (
                <div className="animate-fade-in-right">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-zinc-500" /> Escolha a Equipa
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {barbeiros.map((barber) => (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-2xl border text-center cursor-pointer transition-all ${selectedBarber?.id === barber.id ? "bg-cyan-500/10 border-cyan-500" : "bg-zinc-900 border-zinc-800"}`}
                      >
                        <div
                          className={`w-14 h-14 mx-auto bg-zinc-950 rounded-full flex items-center justify-center text-xl font-black mb-3 border ${selectedBarber?.id === barber.id ? "border-cyan-500 text-cyan-500" : "border-zinc-700 text-zinc-600"}`}
                        >
                          {barber.avatar}
                        </div>
                        <h4
                          className={`font-bold text-sm ${selectedBarber?.id === barber.id ? "text-cyan-400" : "text-white"}`}
                        >
                          {barber.name}
                        </h4>
                        <p className="text-zinc-500 text-[10px] mt-1 uppercase">
                          {barber.especialidade}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etapa 3: Data e Hora */}
              {step === 3 && (
                <div className="animate-fade-in-right space-y-6">
                  <div>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-zinc-500" /> Data
                      Disponível
                    </h3>
                    <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar snap-x">
                      {dias.map((dia) => (
                        <button
                          key={dia}
                          onClick={() => setSelectedDate(dia)}
                          className={`snap-start whitespace-nowrap px-5 py-3 rounded-xl border font-medium transition-all text-sm ${selectedDate === dia ? "bg-cyan-500 text-black border-cyan-500" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="animate-fade-in-up">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-zinc-500" /> Horários
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {horarios.map((hr) => (
                          <button
                            key={hr.time}
                            disabled={!hr.available}
                            onClick={() => setSelectedTime(hr.time)}
                            className={`p-3 rounded-xl border font-bold transition-all text-sm ${!hr.available ? "bg-zinc-950 border-zinc-900 text-zinc-700 opacity-50 cursor-not-allowed line-through" : selectedTime === hr.time ? "bg-cyan-500 border-cyan-500 text-black" : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"}`}
                          >
                            {hr.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Etapa 4: Revisão */}
              {step === 4 && (
                <div className="animate-fade-in-right">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500" /> Resumo do
                    Pedido
                  </h3>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
                      <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                          Serviço
                        </p>
                        <p className="text-white font-bold text-lg">
                          {selectedService?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                          Valor
                        </p>
                        <p className="text-cyan-400 font-black text-lg">
                          R${" "}
                          {selectedService?.price.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-800 font-bold">
                        {selectedBarber?.avatar}
                      </div>
                      <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                          Profissional
                        </p>
                        <p className="text-white font-bold">
                          {selectedBarber?.name}
                        </p>
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                          Data
                        </p>
                        <p className="text-white font-medium text-sm">
                          {selectedDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                          Hora
                        </p>
                        <p className="text-white font-medium text-sm">
                          {selectedTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Fixo do Modal (Botões de Ação) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-zinc-950 via-zinc-950 to-transparent border-t border-zinc-900/50">
              {step === 1 && selectedService && (
                <button
                  onClick={handleAvancar}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 animate-fade-in-up"
                >
                  Avançar para Equipa
                </button>
              )}
              {step === 2 && selectedBarber && (
                <button
                  onClick={handleAvancar}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 animate-fade-in-up"
                >
                  Escolher Data
                </button>
              )}
              {step === 3 && selectedTime && (
                <button
                  onClick={handleAvancar}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 animate-fade-in-up"
                >
                  Rever Agendamento
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={handleConfirmar}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                >
                  Confirmar Reserva
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

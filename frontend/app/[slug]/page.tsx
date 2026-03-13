"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

export default function TelaDoCliente() {
  const params = useParams();
  const slug = params.slug as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // === ESTADOS ===
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Dados da Reserva
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // === FUNÇÕES DE NAVEGAÇÃO ===
  const abrirModal = () => setIsModalOpen(true);
  const fecharModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setSelectedTime(null);
  };
  const handleAvancar = () => setStep((prev) => prev + 1);
  const handleVoltar = () => setStep((prev) => prev - 1);

  // === LÓGICA DE HORÁRIOS ===
  const generateTimeSlots = () => {
    if (!shop?.opens_at || !shop?.closes_at) return [];
    const slots = [];
    let [currentHour, currentMin] = shop.opens_at.split(":").map(Number);
    const [endHour, endMin] = shop.closes_at.split(":").map(Number);
    const totalEndMinutes = endHour * 60 + endMin;

    while (currentHour * 60 + currentMin < totalEndMinutes) {
      const time = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      slots.push({ time, available: true });
      currentMin += 30; // Ajustado para 30min, mude para 10 se preferir
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    return slots;
  };

  const horariosDinamicos = generateTimeSlots();

  // === BUSCA DE DADOS ===
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resShop, resServices, resBarbers] = await Promise.all([
          fetch(`${API_URL}/barbershops/${slug}`),
          fetch(`${API_URL}/barbershops/${slug}/services`),
          fetch(`${API_URL}/barbershops/${slug}/barbers`),
        ]);

        if (resShop.ok) setShop(await resShop.json());
        if (resServices.ok) setServices(await resServices.json());
        if (resBarbers.ok) setBarbers(await resBarbers.json());
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug, API_URL]);

  // === CONFIRMAÇÃO FINAL ===
  const handleConfirmar = async () => {
    if (!customerName || !customerPhone) {
      alert("Preencha seu nome e telefone!");
      return;
    }

    const payload = {
      client_name: customerName,
      client_phone: customerPhone,
      service_id: selectedService.id,
      barber_id: selectedBarber.id,
      barbershop_id: shop.id,
      date: selectedDate,
      time: selectedTime,
    };

    try {
      const res = await fetch(`${API_URL}/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Agendamento realizado com sucesso!");
        fecharModal();
      } else {
        alert("Erro ao agendar. Verifique os dados.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500">
        Carregando...
      </div>
    );
  if (!shop)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Barbearia não encontrada.
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div
        className={`max-w-2xl mx-auto bg-zinc-950 min-h-screen border-x border-zinc-900 pb-24 relative transition-all ${isModalOpen ? "blur-sm" : ""}`}
      >
        {/* Cabeçalho */}
        <div className="pt-12 pb-8 px-6 border-b border-zinc-900">
          <h1 className="text-3xl font-black">{shop.name}</h1>
          <p className="text-zinc-400 flex items-center gap-1 mt-2">
            <MapPin className="w-4 h-4" /> {shop.address}
          </p>
        </div>

        {/* Botão Agendar */}
        <div className="px-6 py-10">
          <button
            onClick={abrirModal}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <CalendarIcon /> Agendar Horário
          </button>
        </div>

        {/* Lista de Profissionais (Equipa) */}
        <div className="px-6">
          <h2 className="text-xl font-bold mb-4">Nossa Equipa</h2>
          <div className="grid grid-cols-2 gap-4">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"
              >
                <p className="font-bold">{b.name}</p>
                <p className="text-xs text-zinc-500 uppercase">{b.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Passo {step} de 4</h2>
              <button onClick={fecharModal}>
                <X />
              </button>
            </div>

            {/* Step 1: Serviços */}
            {step === 1 && (
              <div className="space-y-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`p-4 rounded-xl border cursor-pointer ${selectedService?.id === s.id ? "border-cyan-500 bg-cyan-500/10" : "border-zinc-800"}`}
                  >
                    {s.name} - R$ {s.price}
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Barbeiros */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {barbers.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBarber(b)}
                    className={`p-4 rounded-xl border text-center cursor-pointer ${selectedBarber?.id === b.id ? "border-cyan-500 bg-cyan-500/10" : "border-zinc-800"}`}
                  >
                    {b.name}
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Horários */}
            {step === 3 && (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {horariosDinamicos.map((h) => (
                  <button
                    key={h.time}
                    onClick={() => setSelectedTime(h.time)}
                    className={`p-2 rounded-lg border ${selectedTime === h.time ? "bg-cyan-500 text-black" : "border-zinc-800"}`}
                  >
                    {h.time}
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Dados do Cliente */}
            {step === 4 && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
                />
                <input
                  type="tel"
                  placeholder="Seu WhatsApp"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
                />
                <div className="bg-zinc-900 p-4 rounded-xl text-sm">
                  <p>Serviço: {selectedService?.name}</p>
                  <p>Profissional: {selectedBarber?.name}</p>
                  <p>Horário: {selectedTime}</p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  onClick={handleVoltar}
                  className="flex-1 py-3 bg-zinc-800 rounded-xl"
                >
                  Voltar
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={handleAvancar}
                  disabled={
                    (step === 1 && !selectedService) ||
                    (step === 2 && !selectedBarber) ||
                    (step === 3 && !selectedTime)
                  }
                  className="flex-2 py-3 bg-cyan-600 rounded-xl disabled:opacity-50"
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={handleConfirmar}
                  className="flex-2 py-3 bg-cyan-500 text-black font-bold rounded-xl"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";

// Tipos
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  image_url?: string;
}

interface Barbershop {
  id: number;
  name: string;
  slug: string;
  hours_config: string;
}

interface Booking {
  date_time: string;
  service_duration: number; // <--- Agora recebemos isso do backend
}

interface ServiceListProps {
  services: Service[];
  shop: Barbershop;
}

export default function ServiceList({ services, shop }: ServiceListProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate && shop && selectedService) {
      generateSlots(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, shop, selectedService]); // Recalcula se mudar o serviço (pois a duração muda)

  // Função auxiliar: Converte "09:30" para 570 minutos
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Função auxiliar: Converte 570 para "09:30"
  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const generateSlots = async (dateStr: string) => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedTime("");
    setSlots([]);

    try {
      // 1. Configurações do Dia
      const dateObj = new Date(dateStr + "T00:00:00");
      const dayName = dateObj
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      let config;
      try {
        config = JSON.parse(shop.hours_config);
      } catch {
        config = {};
      }
      const dayConfig = config[dayName];

      if (!dayConfig || !dayConfig.active) {
        setLoadingSlots(false);
        return;
      }

      // 2. Buscar agendamentos existentes
      const res = await fetch(
        `http://127.0.0.1:8000/barbershops/${shop.slug}/bookings`
      );
      const allBookings: Booking[] = await res.json();

      // Filtra os do dia e calcula os intervalos ocupados
      // Ex: Agendamento as 09:00 com duração de 60min ocupa de 540 até 600
      const busyIntervals = allBookings
        .filter((b) => b.date_time.startsWith(dateStr))
        .map((b) => {
          const timePart = b.date_time.split("T")[1]; // "09:00"
          const start = timeToMinutes(timePart);
          const end = start + b.service_duration;
          return { start, end };
        });

      // 3. Gerar slots e validar colisão
      const generatedSlots = [];
      const openMin = timeToMinutes(dayConfig.open);
      const closeMin = timeToMinutes(dayConfig.close);

      // Vamos de 30 em 30 min (Grade Padrão)
      for (let current = openMin; current < closeMin; current += 30) {
        const slotStart = current;
        const slotEnd = current + selectedService.duration; // Fim previsto do NOVO serviço

        // Regra 1: O serviço não pode terminar depois que a loja fecha
        if (slotEnd > closeMin) {
          // Não adiciona na lista, ou adiciona como indisponível
          continue;
        }

        // Regra 2: O intervalo do novo serviço [slotStart, slotEnd] não pode bater em NENHUM intervalo ocupado
        // Colisão acontece se: (StartA < EndB) e (EndA > StartB)
        const isBusy = busyIntervals.some((busy) => {
          return slotStart < busy.end && slotEnd > busy.start;
        });

        generatedSlots.push({
          time: minutesToTime(current),
          available: !isBusy,
        });
      }

      setSlots(generatedSlots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/bookings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          date_time: `${selectedDate}T${selectedTime}`,
          barbershop_id: shop.id,
          service_id: selectedService.id,
        }),
      });

      if (response.ok) {
        alert("Agendamento confirmado!");
        handleCloseModal();
      } else {
        const err = await response.json();
        alert(`Erro: ${err.detail}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedDate("");
    setSelectedTime("");
  };

  return (
    <div>
      {/* LISTA DE SERVIÇOS */}
      <div className="flex flex-col gap-4">
        {services.length === 0 ? (
          <p className="text-gray-500 italic">Nenhum serviço disponível.</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="flex justify-between items-center p-4 bg-white rounded-lg border hover:border-blue-500 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* FOTO DO SERVIÇO */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {service.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sem foto
                  </div>
                )}
              </div>
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
                <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded mt-1 font-bold">
                  Reservar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg my-10">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Agendar: {selectedService.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBooking} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Seu Nome
                  </label>
                  <input
                    required
                    className="w-full border p-2 rounded text-black bg-gray-50"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    WhatsApp
                  </label>
                  <input
                    required
                    className="w-full border p-2 rounded text-black bg-gray-50"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Escolha o Dia
                </label>
                <input
                  required
                  type="date"
                  className="w-full border p-2 rounded text-black font-bold text-lg"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Horários para {selectedService.duration} min
                  </label>

                  {loadingSlots ? (
                    <div className="text-center py-4 text-gray-500">
                      Verificando agenda...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-4 text-red-500 bg-red-50 rounded">
                      Sem horários para este serviço hoje.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                      {slots.map(({ time, available }) => (
                        <button
                          key={time}
                          type="button"
                          disabled={!available}
                          onClick={() => setSelectedTime(time)}
                          className={`
                                        py-2 px-1 rounded text-sm font-bold border transition-all
                                        ${
                                          !available
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed line-through border-transparent opacity-60"
                                            : selectedTime === time
                                            ? "bg-blue-600 text-white border-blue-600 scale-105"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                                        }
                                    `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 text-gray-700 p-3 rounded font-bold hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedTime}
                  className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Confirmando..." : "✅ Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

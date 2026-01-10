"use client";
import { useState, useEffect, useCallback } from "react";

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
interface Barber {
  id: number;
  name: string;
  photo_url?: string;
}
interface Booking {
  date_time: string;
  service_duration: number;
  barber_id: number;
}

interface ServiceListProps {
  services: Service[];
  shop: Barbershop;
}

export default function ServiceList({ services, shop }: ServiceListProps) {
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

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
    fetch(`http://127.0.0.1:8000/barbershops/${shop.slug}/barbers`)
      .then((res) => res.json())
      .then((data) => setBarbers(data));
  }, [shop.slug]);

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const generateSlots = useCallback(
    async (dateStr: string) => {
      if (!selectedService || !selectedBarber) return;
      setLoadingSlots(true);
      setSelectedTime("");
      setSlots([]);

      try {
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

        const res = await fetch(
          `http://127.0.0.1:8000/barbershops/${shop.slug}/bookings`
        );
        const allBookings: Booking[] = await res.json();

        const busyIntervals = allBookings
          .filter(
            (b) =>
              b.date_time.startsWith(dateStr) &&
              b.barber_id === selectedBarber.id
          )
          .map((b) => {
            const timePart = b.date_time.split("T")[1];
            const start = timeToMinutes(timePart);
            return { start, end: start + b.service_duration };
          });

        // INTERVALO DO DIA
        let breakStartMin = -1,
          breakEndMin = -1;
        if (dayConfig.break_start && dayConfig.break_end) {
          breakStartMin = timeToMinutes(dayConfig.break_start);
          breakEndMin = timeToMinutes(dayConfig.break_end);
        }

        const generatedSlots = [];
        const openMin = timeToMinutes(dayConfig.open);
        const closeMin = timeToMinutes(dayConfig.close);

        // MUDANÇA: Incremento de 10 em 10 minutos
        for (let current = openMin; current < closeMin; current += 10) {
          const slotStart = current;
          const slotEnd = current + selectedService.duration;

          if (slotEnd > closeMin) continue;

          // Verifica colisão com Agendamentos
          let isBusy = busyIntervals.some(
            (busy) => slotStart < busy.end && slotEnd > busy.start
          );

          // Verifica colisão com Intervalo (Almoço)
          if (!isBusy && breakStartMin !== -1) {
            if (slotStart < breakEndMin && slotEnd > breakStartMin) {
              isBusy = true; // Caiu no almoço
            }
          }

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
    },
    [selectedService, selectedBarber, shop.hours_config, shop.slug]
  );

  useEffect(() => {
    if (selectedDate && shop && selectedService && selectedBarber) {
      generateSlots(selectedDate);
    }
  }, [selectedDate, shop, selectedService, selectedBarber, generateSlots]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime)
      return;
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
          barber_id: selectedBarber.id,
        }),
      });

      if (response.ok) {
        alert("Agendamento confirmado!");
        handleCloseModal();
      } else {
        const err = await response.json();
        alert(`Erro: ${err.detail}`);
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedDate("");
    setSelectedTime("");
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        {services.length === 0 ? (
          <p className="text-gray-500 italic">Sem serviços.</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="flex items-center p-4 bg-white rounded-lg border hover:border-blue-500 cursor-pointer shadow-sm gap-4 transition-all"
            >
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                {service.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Foto
                  </div>
                )}
              </div>
              <div className="flex-1">
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
                  Agendar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg my-10">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedService.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBooking} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Escolha o Profissional
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber)}
                      className={`p-2 rounded border cursor-pointer flex flex-col items-center gap-1 transition-all ${
                        selectedBarber?.id === barber.id
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {barber.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={barber.photo_url}
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="text-sm font-bold text-gray-700 truncate w-full text-center">
                        {barber.name}
                      </span>
                    </div>
                  ))}
                  {barbers.length === 0 && (
                    <p className="text-red-500 text-sm">
                      Nenhum barbeiro disponível.
                    </p>
                  )}
                </div>
              </div>

              {selectedBarber && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Seu Nome
                      </label>
                      <input
                        required
                        className="w-full border p-2 rounded text-black"
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
                        className="w-full border p-2 rounded text-black"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Data
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full border p-2 rounded text-black font-bold"
                      min={new Date().toISOString().split("T")[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                        Horários com {selectedBarber.name}
                      </label>
                      {loadingSlots ? (
                        <div className="text-center py-4 text-gray-500">
                          Buscando agenda...
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="text-center py-2 text-red-500 bg-red-50 rounded">
                          Sem horários.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                          {slots.map(({ time, available }) => (
                            <button
                              key={time}
                              type="button"
                              disabled={!available}
                              onClick={() => setSelectedTime(time)}
                              className={`py-2 px-1 rounded text-sm font-bold border ${
                                !available
                                  ? "bg-gray-100 text-gray-300 line-through"
                                  : selectedTime === time
                                  ? "bg-blue-600 text-white"
                                  : "bg-white hover:border-blue-500 text-gray-700"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !selectedTime}
                    className="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:opacity-50 mt-2"
                  >
                    {loading ? "..." : "Confirmar Agendamento"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

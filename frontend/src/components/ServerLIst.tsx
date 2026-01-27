/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

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
    [],
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
          `http://127.0.0.1:8000/barbershops/${shop.slug}/bookings`,
        );
        const allBookings: Booking[] = await res.json();

        const busyIntervals = allBookings
          .filter(
            (b) =>
              b.date_time.startsWith(dateStr) &&
              b.barber_id === selectedBarber.id,
          )
          .map((b) => {
            const timePart = b.date_time.split("T")[1];
            const start = timeToMinutes(timePart);
            return { start, end: start + b.service_duration };
          });

        let breakStartMin = -1,
          breakEndMin = -1;
        if (dayConfig.break_start && dayConfig.break_end) {
          breakStartMin = timeToMinutes(dayConfig.break_start);
          breakEndMin = timeToMinutes(dayConfig.break_end);
        }

        const generatedSlots = [];
        const openMin = timeToMinutes(dayConfig.open);
        const closeMin = timeToMinutes(dayConfig.close);

        for (let current = openMin; current < closeMin; current += 15) {
          // Step de 15min para mais opções
          const slotStart = current;
          const slotEnd = current + selectedService.duration;

          if (slotEnd > closeMin) continue;

          let isBusy = busyIntervals.some(
            (busy) => slotStart < busy.end && slotEnd > busy.start,
          );
          if (!isBusy && breakStartMin !== -1) {
            if (slotStart < breakEndMin && slotEnd > breakStartMin) {
              isBusy = true;
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
        toast.error("Erro ao carregar agenda.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedService, selectedBarber, shop.hours_config, shop.slug],
  );

  useEffect(() => {
    if (selectedDate && shop && selectedService && selectedBarber)
      generateSlots(selectedDate);
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
        toast.success("Agendamento confirmado!", { duration: 4000 });
        handleCloseModal();
      } else {
        const err = await response.json();
        toast.error(`Erro: ${err.detail}`);
      }
    } catch {
      toast.error("Erro de conexão.");
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
      {/* LISTA DE SERVIÇOS */}
      <div className="flex flex-col gap-3 pb-20">
        {services.length === 0 ? (
          <p className="text-zinc-500 italic text-center py-10">
            Nenhum serviço disponível.
          </p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="flex items-center p-3 bg-zinc-900/5 hover:bg-zinc-900/10 active:bg-zinc-900/20 rounded-xl border border-transparent hover:border-zinc-300 cursor-pointer gap-4 transition-all group select-none"
            >
              <div className="w-20 h-20 bg-zinc-200 rounded-lg overflow-hidden shrink-0 shadow-sm">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-bold uppercase">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-zinc-900 leading-tight">
                  {service.name}
                </h3>
                <p className="text-sm text-zinc-500 font-medium">
                  ⏱ {service.duration} min
                </p>
              </div>
              <div className="text-right">
                <span className="block font-black text-zinc-900 text-lg">
                  R$ {service.price.toFixed(2)}
                </span>
                <button className="text-[10px] bg-zinc-900 text-white px-3 py-1.5 rounded-full mt-1 font-bold uppercase tracking-wide">
                  Reservar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE AGENDAMENTO (BOTTOM SHEET NO MOBILE) */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay Escuro */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>

          {/* Conteúdo do Modal */}
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            {/* Header do Modal */}
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-white rounded-t-3xl sm:rounded-t-2xl sticky top-0 z-20">
              <div>
                <h2 className="text-xl font-black text-zinc-900 leading-none">
                  {selectedService.name}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  R$ {selectedService.price.toFixed(2)} •{" "}
                  {selectedService.duration} min
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Corpo do Form */}
            <div className="p-5 overflow-y-auto space-y-6 bg-zinc-50">
              {/* 1. Escolha do Barbeiro */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-3 tracking-wider">
                  1. Profissional
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber)}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${selectedBarber?.id === barber.id ? "border-zinc-900 bg-white shadow-md" : "border-transparent bg-white hover:border-zinc-200"}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                        {barber.photo_url ? (
                          <img
                            src={barber.photo_url}
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="text-xs font-bold text-zinc-900 truncate w-full text-center">
                        {barber.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBarber && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* 2. Seus Dados */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-3 tracking-wider">
                      2. Seus Dados
                    </label>
                    <div className="space-y-3">
                      <input
                        required
                        placeholder="Seu Nome"
                        className="w-full bg-white border border-zinc-200 p-3 rounded-xl text-zinc-900 font-bold outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <input
                        required
                        placeholder="Seu WhatsApp (11 99999...)"
                        type="tel"
                        className="w-full bg-white border border-zinc-200 p-3 rounded-xl text-zinc-900 font-bold outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 3. Data e Hora */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-3 tracking-wider">
                      3. Data e Hora
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full bg-white border border-zinc-200 p-3 rounded-xl text-zinc-900 font-bold outline-none focus:border-zinc-900 mb-4"
                      min={new Date().toISOString().split("T")[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    {selectedDate && (
                      <div className="bg-white p-3 rounded-xl border border-zinc-200">
                        {loadingSlots ? (
                          <div className="text-center py-4 text-zinc-400 text-sm animate-pulse">
                            Consultando agenda...
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="text-center py-3 text-red-500 text-sm font-bold">
                            Dia sem horários livres.
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {slots.map(({ time, available }) => (
                              <button
                                key={time}
                                type="button"
                                disabled={!available}
                                onClick={() => setSelectedTime(time)}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${!available ? "bg-zinc-50 text-zinc-300 line-through border-transparent" : selectedTime === time ? "bg-zinc-900 text-white border-zinc-900 shadow-md transform scale-105" : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-900"}`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-5 border-t border-zinc-100 bg-white pb-8 sm:pb-5">
              <button
                onClick={handleBooking}
                disabled={
                  loading || !selectedTime || !customerName || !customerPhone
                }
                className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase tracking-wide text-sm shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading ? "Confirmando..." : "Confirmar Agendamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

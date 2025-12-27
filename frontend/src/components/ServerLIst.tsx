"use client"; // <--- Indica que este componente tem interatividade

import { useState } from "react";

// Tipos
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface ServiceListProps {
  services: Service[];
  barbershopId: number; // Precisamos disso para salvar no banco
}

export default function ServiceList({
  services,
  barbershopId,
}: ServiceListProps) {
  // Estado para saber qual serviço foi clicado (se null, modal fecha)
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Estados do Formulário
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Função para abrir o modal
  const handleOpenModal = (service: Service) => {
    setSelectedService(service);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setSelectedService(null);
    setCustomerName("");
    setCustomerPhone("");
    setDate("");
  };

  // Função para Salvar o Agendamento
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/bookings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          date_time: date, // O input datetime-local já manda no formato certo
          barbershop_id: barbershopId,
          service_id: selectedService.id,
        }),
      });

      if (response.ok) {
        alert(`Agendamento confirmado para ${selectedService.name}!`);
        handleCloseModal();
      } else {
        alert("Erro ao agendar. Verifique os dados.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* --- LISTA DE SERVIÇOS --- */}
      <div className="flex flex-col gap-4">
        {services.length === 0 ? (
          <p className="text-gray-500 italic">Nenhum serviço cadastrado.</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleOpenModal(service)}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border hover:border-blue-500 cursor-pointer group transition-all"
            >
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
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Reservar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL (POP-UP) --- */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-bounce-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Agendar: {selectedService.name}
            </h2>

            <form onSubmit={handleBooking} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Seu Nome
                </label>
                <input
                  required
                  type="text"
                  className="w-full border p-2 rounded text-black"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  WhatsApp / Telefone
                </label>
                <input
                  required
                  type="text"
                  className="w-full border p-2 rounded text-black"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Data e Hora
                </label>
                <input
                  required
                  type="datetime-local"
                  className="w-full border p-2 rounded text-black"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-800 p-2 rounded font-bold hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Agendando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

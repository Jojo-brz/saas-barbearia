/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Scissors,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  X,
  Phone,
  ImageIcon,
} from "lucide-react";

export default function PaginaCliente() {
  const BACKEND_URL = "http://127.0.0.1:8000";

  const getImageUrl = (imageString: string | null | undefined) => {
    if (!imageString) return "";

    // 1. Se a string já for um Base64 real (começa com data:image), exibe diretamente
    if (imageString.startsWith("data:image")) {
      return imageString;
    }

    // 2. Se a string já for um link completo (começa com http), exibe diretamente
    if (imageString.startsWith("http")) {
      return imageString;
    }

    // 3. Se for apenas o nome do ficheiro (ex: 39c98c8ae82e444282ac8610a01b82d1.jpeg),
    // aponta para o backend na porta 8000!
    // Remove a barra inicial se existir para evitar "//"
    const cleanPath = imageString.startsWith("/")
      ? imageString.substring(1)
      : imageString;

    // Verifica se o caminho já tem "uploads/", se não tiver, adiciona
    if (cleanPath.startsWith("uploads/")) {
      return `${BACKEND_URL}/${cleanPath}`;
    } else {
      return `${BACKEND_URL}/uploads/${cleanPath}`;
    }
  };

  const params = useParams();
  const slug = params.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados do Agendamento (Wizard)
  const [step, setStep] = useState(0); // 0 = fechado, 1 a 5 = passos
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. CARREGAR DADOS DA BARBEARIA PELO SLUG
  useEffect(() => {
    if (!slug) return; // Se não tem slug, não faz nada ainda

    const fetchShop = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/barbershops/by-slug/${slug}`,
        );
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        } else {
          toast.error("Barbearia não encontrada.");
        }
      } catch (err) {
        console.error("Erro ao buscar dados da loja", err);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [slug]);

  // 2. NOVO BLOCO: O "Cérebro" da Agenda (Busca horários reais do banco)
  useEffect(() => {
    // Só busca se o cliente estiver no Passo 3 e tiver escolhido Data, Barbeiro e Serviço
    if (
      slug &&
      step === 3 &&
      appointmentDate &&
      selectedBarber &&
      selectedService
    ) {
      setCarregandoHorarios(true);

      fetch(
        `http://127.0.0.1:8000/barbershops/${slug}/available-times?barber_id=${selectedBarber.id}&service_id=${selectedService.id}&date=${appointmentDate}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setHorariosDisponiveis(data); // "data" aqui é a lista de horários vinda do Python
          setCarregandoHorarios(false);
        })
        .catch(() => {
          setCarregandoHorarios(false);
        });
    }
  }, [step, appointmentDate, selectedBarber, selectedService, slug]);

  // 2. CONFIRMAR AGENDAMENTO (ENVIA IDs PARA O BACKEND)
  const handleConfirm = async () => {
    if (!clientName || !clientPhone)
      return toast.error("Preencha os seus dados");

    setIsSubmitting(true);
    const toastId = toast.loading("Confirmando o seu horário...");

    try {
      // 1. O payload precisa garantir que os IDs sejam NÚMEROS e a DATA esteja em ISO
      const payload = {
        client_name: clientName,
        client_phone: clientPhone,
        // Garante o formato YYYY-MM-DDTHH:MM:SS
        date_time: `${appointmentDate}T${selectedTime}:00`,
        service_id: Number(selectedService.id),
        barber_id: Number(selectedBarber.id),
        barbershop_id: Number(shop.id),
      };

      const res = await fetch("http://127.0.0.1:8000/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Se o backend retornar erro, tentamos ler a mensagem detalhada dele
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao agendar");
      }

      toast.success("Agendado com sucesso!", { id: toastId });
      setStep(5); // Passo de Sucesso
    } catch (err: any) {
      // Mostra o erro real que o Python enviou (ex: "Horário já ocupado")
      toast.error(err.message || "Falha ao agendar. Tente outro horário.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-bounce">
          <Scissors size={48} className="text-amber-500" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <h1 className="text-white text-xl font-bold">
          Barbearia não encontrada :(
        </h1>
      </div>
    );
  }

  // Tenta ler as imagens sem quebrar o site
  let portfolioSeguro: string[] = [];
  try {
    if (typeof shop?.portfolio_images === "string") {
      const rawText = shop.portfolio_images.trim();

      // 1. Se foi salvo com ponto e vírgula (O SEU CASO ATUAL)
      if (rawText.includes(";")) {
        portfolioSeguro = rawText
          .split(";")
          .filter((url: string) => url.trim() !== "");
      }
      // 2. Se for um JSON válido (Array stringificado)
      else if (rawText.startsWith("[")) {
        portfolioSeguro = JSON.parse(rawText);
      }
      // 3. Se for apenas uma foto isolada
      else if (rawText !== "") {
        portfolioSeguro = [rawText];
      }
    } else if (Array.isArray(shop?.portfolio_images)) {
      portfolioSeguro = shop.portfolio_images;
    }
  } catch (e) {
    console.error("Erro ao processar as fotos do portfólio:", e);
    portfolioSeguro = [];
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Banner de Capa */}
      <div className="h-64 bg-zinc-900 relative overflow-hidden">
        {shop.logo_url && (
          <img
            src={getImageUrl(shop?.logo_url)}
            alt={shop?.name || "Fundo da Barbearia"}
            className="w-full h-full object-cover opacity-40 blur-sm scale-110"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).onerror = null;
              (e.currentTarget as HTMLImageElement).src =
                "/placeholder-logo.png";
            }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-50 to-transparent" />
      </div>

      {/* Info da Barbearia */}
      <div className="px-6 -mt-20 relative z-10 max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-4xl shadow-xl border border-zinc-100">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-zinc-900 rounded-3xl p-1 shadow-lg border-4 border-white overflow-hidden">
              <img
                src={getImageUrl(shop?.logo_url)} // ou getLogoUrl se você mudou o nome da função
                className="w-full h-full object-cover rounded-2xl"
                alt="Logo da Barbearia"
                onError={(e) => {
                  // 1. Desativa o loop infinito caso o próprio placeholder dê erro
                  (e.currentTarget as HTMLImageElement).onerror = null;
                  // 2. Coloca a imagem de segurança
                  (e.currentTarget as HTMLImageElement).src =
                    "/placeholder-logo.png";
                }}
              />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">
              {shop.name}
            </h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium flex items-center justify-center gap-1">
              <MapPin size={14} className="text-amber-500" />{" "}
              {shop.address || "Endereço não informado"}
            </p>
            <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
              {shop.description}
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full mt-6 bg-black text-amber-500 font-black py-5 rounded-2xl shadow-lg shadow-black/20 active:scale-95 transition-all text-lg"
          >
            AGENDAR AGORA
          </button>
        </div>
      </div>

      {/* ================= PORTFÓLIO (NOVO) ================= */}
      {(() => {
        const images = shop?.portfolio_images
          ? shop.portfolio_images
              .split(",")
              .map((img: string) => img.trim())
              .filter((img: string) => img !== "")
              .map((img: string) => {
                if (img.startsWith("http") || img.startsWith("data:"))
                  return img;
                const cleanPath = img.startsWith("/") ? img : `/${img}`;
                return `http://127.0.0.1:8000${cleanPath}`;
              })
          : [];

        if (images.length === 0) return null;

        return (
          <div className="px-6 mt-10 max-w-2xl mx-auto">
            <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <ImageIcon size={18} className="text-amber-500" /> Cortes modelo
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden border border-zinc-200 bg-white"
                >
                  <img
                    src={img}
                    alt="Trabalho"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Lista de Serviços (Pré-visualização) */}
      <div className="px-6 mt-10 max-w-2xl mx-auto">
        <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Scissors size={18} className="text-amber-500" /> Serviços e Preços
        </h2>
        <div className="space-y-3">
          {shop.services?.map((svc: any) => (
            <div
              key={svc.id}
              className="bg-white p-4 rounded-2xl border border-zinc-100 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-bold text-zinc-800">{svc.name}</p>
                <p className="text-xs text-zinc-400 font-bold">
                  {svc.duration} min
                </p>
              </div>
              <p className="font-black text-zinc-900">
                R${svc.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL DE AGENDAMENTO (WIZARD) ================= */}
      {step > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-3">
                {step > 1 && step < 5 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="text-zinc-400 hover:text-black transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <h2 className="font-black text-zinc-900 uppercase tracking-widest text-sm">
                  {step === 5 ? "Confirmado" : `Passo ${step} de 4`}
                </h2>
              </div>
              <button
                onClick={() => setStep(0)}
                className="text-zinc-300 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* PASSO 1: SERVIÇOS */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-zinc-900">
                    Escolha o Serviço
                  </h3>
                  <div className="grid gap-3">
                    {shop.services?.map((svc: any) => (
                      <button
                        key={svc.id}
                        onClick={() => {
                          setSelectedService(svc);
                          setStep(2);
                        }}
                        className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedService?.id === svc.id ? "border-amber-500 bg-amber-50 shadow-md" : "border-zinc-100 hover:border-zinc-300"}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-800">
                            {svc.name}
                          </span>
                          <span className="font-black text-zinc-900">
                            R${svc.price.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-1">
                          <Clock size={12} /> {svc.duration} minutos
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 2: BARBEIRO */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-zinc-900">
                    Com quem?
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {shop.barbers?.map((brb: any) => (
                      <button
                        key={brb.id}
                        onClick={() => {
                          setSelectedBarber(brb);
                          setStep(3);
                        }}
                        className={`flex flex-col items-center p-5 rounded-3xl border-2 transition-all ${selectedBarber?.id === brb.id ? "border-amber-500 bg-amber-50" : "border-zinc-100"}`}
                      >
                        <div className="w-16 h-16 bg-zinc-200 rounded-2xl mb-3 overflow-hidden shadow-sm">
                          <img
                            src={
                              getImageUrl(brb.profile_image_url) ||
                              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                            }
                            className="w-full h-full object-cover"
                            alt={brb.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).onerror =
                                null;
                              (e.currentTarget as HTMLImageElement).src =
                                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                            }}
                          />
                        </div>
                        <span className="font-bold text-sm text-zinc-800">
                          {brb.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                          {brb.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 3: DATA E HORA */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-zinc-900">Quando?</h3>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500"
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />

                  {/* --- LÓGICA DINÂMICA DE HORÁRIOS --- */}
                  {!appointmentDate ? (
                    <div className="py-6 text-center bg-zinc-100 rounded-2xl border border-zinc-200">
                      <p className="text-zinc-500 font-bold">
                        Escolha uma data acima para ver os horários.
                      </p>
                    </div>
                  ) : carregandoHorarios ? (
                    <div className="py-10 text-center">
                      <p className="text-zinc-500 font-bold animate-pulse">
                        Buscando horários...
                      </p>
                    </div>
                  ) : horariosDisponiveis.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {horariosDisponiveis.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedTime(t);
                            setStep(4);
                          }}
                          className={`py-3 rounded-xl border-2 text-sm font-black transition-all ${
                            selectedTime === t
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-zinc-50 bg-zinc-50 text-zinc-600 hover:border-zinc-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-red-500 font-bold">
                        Poxa! Nenhum horário disponível para este dia.
                      </p>
                      <p className="text-red-400 text-xs mt-1">
                        Tente selecionar outra data.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 4: DADOS E CONFIRMAÇÃO */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-zinc-900">
                    Quase lá!
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Seu Nome Completo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500"
                    />
                    <input
                      type="tel"
                      placeholder="Telemóvel (ex: 912...)"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500"
                    />
                  </div>

                  <div className="bg-zinc-900 p-6 rounded-[28px] text-white space-y-2 shadow-xl">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                      Resumo do Agendamento
                    </p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      <Scissors size={18} className="text-amber-500" />{" "}
                      {selectedService?.name}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <User size={16} /> com {selectedBarber?.name}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Calendar size={16} /> {appointmentDate} às {selectedTime}
                    </p>
                    <div className="border-t border-zinc-800 mt-4 pt-4 flex justify-between items-center">
                      <span className="text-zinc-400 font-bold">Total</span>
                      <span className="text-xl font-black text-amber-500">
                        R${selectedService?.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-lg"
                  >
                    {isSubmitting ? "AGENDANDO..." : "CONFIRMAR AGENDAMENTO"}
                  </button>
                </div>
              )}

              {/* PASSO 5: SUCESSO */}
              {step === 5 && (
                <div className="text-center py-10">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-2">
                    Tudo Certo!
                  </h3>
                  <p className="text-zinc-500 font-medium mb-8">
                    O seu horário foi confirmado. Te esperamos lá!
                  </p>
                  <button
                    onClick={() => setStep(0)}
                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

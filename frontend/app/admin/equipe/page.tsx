/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Scissors,
  ShieldAlert,
  Users,
  Key,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import imageCompression from "browser-image-compression";

export default function Equipe() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || ${process.env.NEXT_PUBLIC_API_URL}";

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

  useEffect(() => {
    const token = localStorage.getItem("saas_token");
    const userData = localStorage.getItem("saas_user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchTeamStats(parsedUser.barbershop_id || parsedUser.id);
  }, [router]);

  // --- A NOSSA FECHADURA ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("saas_token");
    if (!token) {
      toast.error("Sessão inválida. Faça login.");
      router.push("/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchTeamStats = async (shopId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      // Agora chamamos a rota que traz os ganhos mensais!
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/barbershops/${shopId}/team-earnings`,
        { headers },
      );
      if (res.ok) {
        setBarbers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const handleUpdatePhoto = async (
    barberId: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Configurações de compressão
    const options = {
      maxSizeMB: 0.1, // Limita a foto a 100KB (muito leve!)
      maxWidthOrHeight: 400, // Redimensiona para 400px (ideal para fotos de perfil)
      useWebWorker: true,
    };

    const toastId = toast.loading("Otimizando imagem...");

    try {
      // 1. Comprime a imagem no navegador do cliente
      const compressedFile = await imageCompression(file, options);

      // 2. Converte para Base64 (o formato que seu main.py espera)
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // 3. Envia para o seu backend (ajuste a rota se necessário)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/barbers/${barberId}/photo`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // 2. Nome do token corrigido para 'saas_token'
              Authorization: `Bearer ${localStorage.getItem("saas_token")}`,
            },
            body: JSON.stringify({ photo_base64: base64String }),
          },
        );

        if (response.ok) {
          toast.success("Foto atualizada com sucesso!", { id: toastId });
          // Aqui você pode atualizar o estado local para a foto mudar na tela sem F5
          // setBarbers(...)
        } else {
          toast.error("Erro ao salvar no servidor", { id: toastId });
        }
      };
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar imagem", { id: toastId });
    }
  };

  const handleToggleStatus = async (barberId: number) => {
    const headers = getAuthHeaders(); // Ou a sua função de pegar o token
    if (!headers) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/barbers/${barberId}/toggle`,
        {
          method: "PUT",
          headers,
        },
      );

      if (res.ok) {
        const data = await res.json();

        setBarbers((prevBarbers) =>
          prevBarbers.map((b) =>
            b.id === barberId ? { ...b, is_active: data.is_active } : b,
          ),
        );

        toast.success(
          data.is_active
            ? "Barbeiro visível na loja!"
            : "Barbeiro oculto da loja!",
        );
      } else {
        toast.error("Erro ao alterar o status.");
      }
    } catch (err) {
      toast.error("Erro de conexão ao atualizar status.");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 pb-10">
      <header className="bg-white px-6 py-5 shadow-sm border-b border-zinc-200 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-zinc-900 flex items-center gap-2 uppercase tracking-tight">
              <Users size={24} className="text-amber-500" /> Equipe
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Gestão de barbeiros e acessos
            </p>
          </div>
        </div>
      </header>

      {/* Ajuste de padding no mobile para não encostar nas bordas */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-4">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="bg-white p-4 sm:p-5 rounded-4xl shadow-sm border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* 1 e 2. FOTO E DADOS (AGRUPADOS) */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative group shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-100 border-2 border-zinc-200 overflow-hidden flex items-center justify-center shadow-inner">
                    {barber.profile_image_url ? (
                      <img
                        src={getImageUrl(barber.profile_image_url)}
                        alt={barber.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={24} className="text-zinc-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera size={18} className="text-white" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleUpdatePhoto(barber.id, e)}
                    />
                  </label>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black text-zinc-900 truncate uppercase text-sm">
                    {barber.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase">
                      {barber.role === "OWNER" || barber.role === "GERENTE" ? (
                        <ShieldAlert size={12} className="text-amber-500" />
                      ) : (
                        <Scissors size={12} />
                      )}
                      {barber.role === "OWNER"
                        ? "Dono"
                        : barber.role === "GERENTE"
                          ? "Gerente"
                          : "Barbeiro"}
                    </span>

                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-100">
                      R$ {barber.ganho_mensal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. PIN E STATUS (LINHA DE BAIXO NO MOBILE / DIREITA NO PC) */}
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pt-3 border-t border-zinc-50 sm:border-0 sm:pt-0">
                <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-2xl border border-zinc-100">
                  <Key size={12} className="text-zinc-400" />
                  <span className="font-mono text-xs font-black text-zinc-600 tracking-tighter">
                    PIN {barber.pin}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleStatus(barber.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 ${
                    barber.is_active === false || barber.is_active === 0
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                  }`}
                >
                  {barber.is_active === false || barber.is_active === 0 ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                  <span className="hidden xs:inline">
                    {barber.is_active === false || barber.is_active === 0
                      ? "Oculto"
                      : "Visível"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Camera,
  Store,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  X,
  Clock,
} from "lucide-react";
import imageCompression from "browser-image-compression";

export default function PerfilBarbearia() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Define a URL base para as imagens
  const BACKEND_URL = "http://127.0.0.1:8000";

  // Estados do Perfil
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [portfolioBase64, setPortfolioBase64] = useState<string[]>([]);

  // Estados de Horário
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");
  const [intervalStart, setIntervalStart] = useState("12:00");
  const [intervalEnd, setIntervalEnd] = useState("13:00");

  useEffect(() => {
    const storedUser = localStorage.getItem("saas_user");
    const connectedShop = localStorage.getItem("connected_shop"); // Vai buscar a loja salva no Passo 1 do Login

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      // Tenta achar o slug no user, se não tiver, pega do connectedShop
      let shopSlug = parsedUser.slug;
      if (!shopSlug && connectedShop) {
        shopSlug = JSON.parse(connectedShop).slug;
        parsedUser.slug = shopSlug; // Já adiciona o slug ao usuário na memória
      }

      setUser(parsedUser);

      // Agora o slug existe com certeza, então ele carrega as fotos e os dados!
      if (shopSlug && shopSlug !== "undefined") {
        fetchShop(shopSlug);
      }
    }
  }, []);
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

  const fetchShop = async (slug: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/barbershops/by-slug/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setDescription(data.description || "");
        setAddress(data.address || "");
        setLogoBase64(data.logo_url || "");

        if (data.portfolio_images) {
          const images = data.portfolio_images
            .split(",")
            .filter((i: string) => i.trim() !== "");
          setPortfolioBase64(images);
        } else {
          setPortfolioBase64([]);
        }

        setOpenTime(data.open_time || "09:00");
        setCloseTime(data.close_time || "19:00");
        setIntervalStart(data.interval_start || "12:00");
        setIntervalEnd(data.interval_end || "13:00");
      }
    } catch (err) {
      console.error("Erro ao carregar dados da barbearia");
    }
  };

  // Função essencial: Resolve se a imagem é um Base64 novo ou uma URL do servidor
  const handleLogoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 400 };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => setLogoBase64(reader.result as string);
    } catch (error) {
      toast.error("Erro ao processar logo.");
    }
  };

  const handlePortfolioUpload = async (e: any) => {
    const files = Array.from(e.target.files);
    if (portfolioBase64.length + files.length > 6) {
      toast.error("Limite de 6 fotos atingido.");
      return;
    }

    for (const file of files as File[]) {
      try {
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800 };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          setPortfolioBase64((prev) => [...prev, reader.result as string]);
        };
      } catch (error) {
        toast.error("Erro ao processar foto.");
      }
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioBase64((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user?.slug) fetchShop(user.slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const token = localStorage.getItem("saas_token");
    const shopId = user.barbershop_id || user.id;

    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/barbershops/${shopId}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: description,
            address: address,
            logo_base64: logoBase64,
            portfolio_base64: portfolioBase64,
            open_time: openTime,
            close_time: closeTime,
            interval_start: intervalStart,
            interval_end: intervalEnd,
          }),
        },
      );

      if (res.ok) {
        toast.success("Perfil guardado com sucesso!");
        setIsEditing(false);

        // 1. Busca o slug de forma 100% segura
        const storedUser = localStorage.getItem("saas_user");
        const safeSlug =
          user?.slug || (storedUser ? JSON.parse(storedUser).slug : null);

        // 2. Só recarrega se tivermos a certeza que o slug existe
        if (safeSlug && safeSlug !== "undefined") {
          fetchShop(safeSlug);
        } else {
          console.warn(
            "Slug não encontrado para recarregar os dados automaticamente.",
          );
        }
      } else {
        toast.error("Erro ao guardar no servidor.");
      }
    } catch (error) {
      toast.error("Erro de ligação ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 pb-10">
      <header className="bg-white px-6 py-5 shadow-sm border-b border-zinc-200 sticky top-0 z-10 flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-zinc-600" />
        </button>
        <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
          Perfil da Loja
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-md mx-auto">
        {/* LOGO */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-[40px] bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
              {logoBase64 ? (
                <img
                  src={getImageUrl(logoBase64) || ""}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).onerror = null;
                    (e.currentTarget as HTMLImageElement).src =
                      "/placeholder-logo.png"; // Ou um link do Flaticon
                  }}
                />
              ) : (
                <Store size={48} className="text-zinc-200" />
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 bg-amber-500 text-black p-3 rounded-2xl shadow-lg cursor-pointer hover:bg-amber-400 transition-all">
                <Camera size={20} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* INFO BÁSICA */}
        <section className="bg-white p-6 rounded-4xl shadow-sm border border-zinc-100 space-y-4">
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Sobre a Barbearia
            </label>
            <textarea
              disabled={!isEditing}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-amber-500 h-28 resize-none transition-all disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Localização
            </label>
            <input
              disabled={!isEditing}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-amber-500 transition-all disabled:opacity-60"
            />
          </div>
        </section>

        {/* FUNCIONAMENTO E ALMOÇO (RESTAURADO) */}
        <section className="bg-white p-6 rounded-4xl shadow-sm border border-zinc-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-600" />
            <h2 className="font-black text-zinc-900 uppercase tracking-tight text-sm">
              Horários
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                Abertura
              </label>
              <input
                disabled={!isEditing}
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-bold text-zinc-700 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
                Fechamento
              </label>
              <input
                disabled={!isEditing}
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-bold text-zinc-700 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-zinc-200">
            <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 ml-1">
              Pausa para Almoço
            </p>
            <div className="grid grid-cols-2 gap-4">
              <input
                disabled={!isEditing}
                type="time"
                value={intervalStart}
                onChange={(e) => setIntervalStart(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-bold text-zinc-700 disabled:opacity-60"
              />
              <input
                disabled={!isEditing}
                type="time"
                value={intervalEnd}
                onChange={(e) => setIntervalEnd(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-bold text-zinc-700 disabled:opacity-60"
              />
            </div>
          </div>
        </section>

        {/* PORTFÓLIO */}
        <section className="bg-white p-6 rounded-4xl shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={20} className="text-zinc-400" />
              <h2 className="font-black text-zinc-900 uppercase tracking-tight text-sm">
                Trabalhos
              </h2>
            </div>
            {isEditing && (
              <label className="text-amber-600 text-[10px] font-black uppercase tracking-widest cursor-pointer bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-all">
                + Adicionar
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*"
                  onChange={handlePortfolioUpload}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {portfolioBase64.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50"
              >
                <img
                  src={getImageUrl(img) || ""}
                  alt="Portfolio"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).onerror = null;
                    // Carrega uma imagem de espaço reservado cinza se a foto do corte falhar
                    (e.currentTarget as HTMLImageElement).src =
                      "https://placehold.co/400x400/e4e4e7/a1a1aa?text=Sem+Foto";
                  }}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removePortfolioImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg shadow-md"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTÕES DE AÇÃO */}
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full bg-zinc-900 text-white font-black text-lg py-5 rounded-3xl shadow-xl active:scale-95 transition-all"
          >
            EDITAR PERFIL
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-white text-zinc-400 font-black py-5 rounded-3xl border border-zinc-200 active:scale-95 transition-all"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-amber-500 text-black font-black py-5 rounded-3xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Save size={20} />
              {loading ? "A GUARDAR..." : "SALVAR ALTERAÇÕES"}
            </button>
          </div>
        )}
      </form>
    </main>
  );
}

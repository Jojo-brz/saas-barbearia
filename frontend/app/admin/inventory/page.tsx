/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Minus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function InventoryMobile() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [barbershopId, setBarbershopId] = useState<number | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("saas_user") || "{}");
    if (user.barbershop_id) setBarbershopId(user.barbershop_id);
    if (user.role) setUserRole(user.role);
  }, []);

  // --- A NOSSA FECHADURA NO FRONTEND ---
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

  const loadProducts = async () => {
    if (!barbershopId) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/${barbershopId}/products`,
        { headers },
      );
      if (res.status === 401 || res.status === 403) {
        toast.error("Acesso negado.");
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Erro ao carregar estoque");
    }
  };

  useEffect(() => {
    loadProducts();
  }, [barbershopId]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/${barbershopId}/products`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name,
            price: parseFloat(price),
            stock_quantity: parseInt(qty),
          }),
        },
      );

      if (res.ok) {
        toast.success("Produto adicionado!");
        setName("");
        setPrice("");
        setQty("");
        setShowAdd(false);
        loadProducts();
      } else {
        toast.error("Sem permissão para adicionar.");
      }
    } catch (err) {
      toast.error("Falha ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este produto do estoque?"))
      return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (res.ok) {
        toast.success("Produto removido");
        loadProducts(); // Recarrega a lista
      } else {
        toast.error("Erro ao remover ou acesso negado");
      }
    } catch (err) {
      toast.error("Erro na conexão");
    }
  };

  const handleQuickSell = async (id: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}/sell`,
        {
          method: "PATCH",
          headers,
        },
      );
      if (res.ok) {
        toast.success("-1 no estoque", { position: "bottom-center" });
        loadProducts();
      } else {
        toast.error("Estoque esgotado ou acesso negado!");
      }
    } catch (err) {
      toast.error("Erro na operação");
    }
  };

  const handleRestock = async (id: number) => {
    // Pede ao utilizador a quantidade usando um prompt simples nativo do navegador
    const qtyStr = window.prompt(
      "Quantas unidades chegaram para repor o estoque?",
    );
    if (!qtyStr) return; // Se cancelar ou deixar vazio, ignora

    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Por favor, insira um número válido.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    const tid = toast.loading("Adicionando ao estoque...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}/restock`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ quantity: qty }),
        },
      );

      if (res.ok) {
        toast.success(`+${qty} unidades adicionadas!`, { id: tid });
        loadProducts(); // Recarrega a lista para mostrar o novo valor
      } else {
        toast.error("Erro ou acesso negado", { id: tid });
      }
    } catch (err) {
      toast.error("Erro de conexão", { id: tid });
    }
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 text-zinc-900">
      {/* ... (Todo o layout visual mantém-se exatamente igual) ... */}
      <header className="bg-white border-b p-5 pt-10 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black italic flex items-center gap-2">
            <Package className="text-amber-500" size={28} /> ESTOQUE
          </h1>
          {userRole !== "BARBER" && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className={`${showAdd ? "bg-zinc-200" : "bg-amber-500 text-black"} p-2 rounded-xl shadow-sm transition-colors`}
            >
              {showAdd ? <Minus size={20} /> : <Plus size={20} />}
            </button>
          )}
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-3.5 text-zinc-400" size={20} />
          <input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 ring-amber-500 outline-none text-zinc-800 font-medium"
          />
        </div>
      </header>

      <main className="p-4 space-y-4">
        {showAdd && (
          <section className="bg-white p-6 rounded-4xl border-2 border-amber-500 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="font-bold text-lg mb-4">Novo Produto</h2>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <input
                required
                placeholder="Nome do Item"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-zinc-100 rounded-2xl outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Preço R$"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-4 bg-zinc-100 rounded-2xl outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Qtd Inicial"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full p-4 bg-zinc-100 rounded-2xl outline-none"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
              >
                {loading ? "A Salvar..." : "Confirmar Cadastro"}
              </button>
            </form>
          </section>
        )}

        <div className="space-y-3">
          {filteredProducts.map((item: any) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-[28px] shadow-sm border border-zinc-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.stock_quantity < 5 ? "bg-red-50 text-red-500" : "bg-zinc-100 text-zinc-500"}`}
                >
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="font-bold text-zinc-800 text-lg leading-tight">
                    {item.name}
                  </p>
                  <p className="text-sm text-zinc-500 font-medium">
                    R${item.price.toFixed(2)} •{" "}
                    <span
                      className={
                        item.stock_quantity < 5 ? "text-red-600 font-bold" : ""
                      }
                    >
                      {item.stock_quantity} un.
                    </span>
                  </p>
                  {item.stock_quantity < 5 && (
                    <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={12} /> Repor Urgente
                    </span>
                  )}
                </div>
              </div>
              {(userRole === "OWNER" || userRole === "GERENTE") && (
                <>
                  <button
                    onClick={() => handleRestock(item.id)}
                    className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    title="Repor Estoque"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(item.id)}
                    className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    title="Excluir Produto"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
              <button
                onClick={() => handleQuickSell(item.id)}
                className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center active:scale-75 transition-all shadow-md"
              >
                <Minus size={24} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-4 flex justify-around items-center rounded-t-4xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-30">
        <div
          className="flex flex-col items-center gap-1 text-zinc-400"
          onClick={() => router.push("/admin/agenda")}
        >
          <div className="w-6 h-6 rounded-lg bg-zinc-100" />
          <span className="text-[10px] font-medium">Agenda</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-amber-600">
          <div className="bg-amber-100 p-2 rounded-xl">
            <Package size={22} />
          </div>
          <span className="text-[10px] font-bold">Estoque</span>
        </div>
        <div
          className="flex flex-col items-center gap-1 text-zinc-400"
          onClick={() => router.push("/admin/dashboard")}
        >
          <div className="w-6 h-6 rounded-lg bg-zinc-100" />
          <span className="text-[10px] font-medium">Menu</span>
        </div>
      </nav>
    </div>
  );
}

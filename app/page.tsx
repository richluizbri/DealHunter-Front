"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "./lib/api";
import { Skeleton } from "@/components/ui/skeleton";

function calcVariacao(product) {
  const h = product.history || [];
  if (h.length < 2) return null;
  return ((h[0].preco - h[1].preco) / h[1].preco) * 100;
}

export default function Home() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("default");
  const [mounted, setMounted]     = useState(false);
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState(null);
  const [newUrl, setNewUrl]       = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlMsg, setUrlMsg]       = useState(null);
  const [scrapingAll, setScrapingAll] = useState(false);
  const [scrapeMsg, setScrapeMsg]     = useState(null);
  const limit = 12;

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  async function fetchProducts(p = 1) {
    try {
      setLoading(true);
      const { data } = await api.get("/products", { params: { page: p, limit } });
      setProducts(data.products || []);
      setMeta({ total: data.total, totalPages: data.totalPages, currentPage: data.currentPage });
    } catch { setError("Erro ao carregar produtos."); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchProducts(page); }, [page]);

  async function handleAddUrl() {
    if (!newUrl.trim()) return;
    setAddingUrl(true);
    setUrlMsg(null);
    try {
      await api.post("/products", { url: newUrl.trim() });
      setUrlMsg({ ok: true, text: "✅ Produto adicionado com sucesso!" });
      setNewUrl("");
      fetchProducts(1);
      setPage(1);
    } catch (e) {
      setUrlMsg({ ok: false, text: e?.response?.data?.error || "❌ Erro ao adicionar produto." });
    } finally {
      setAddingUrl(false);
      setTimeout(() => setUrlMsg(null), 4000);
    }
  }

  async function handleScrapeAll() {
    setScrapingAll(true);
    setScrapeMsg("Atualizando todos os produtos...");
    try {
      const { data } = await api.post("/products/scrape");
      setScrapeMsg(`✅ ${data.message}`);
      fetchProducts(page);
    } catch { setScrapeMsg("❌ Erro ao executar coleta."); }
    finally {
      setScrapingAll(false);
      setTimeout(() => setScrapeMsg(null), 4000);
    }
  }

  const filtered = products.filter((p) => p.titulo.toLowerCase().includes(search.toLowerCase()));
  const sorted   = [...filtered].sort((a, b) => {
    if (sortBy === "preco_asc")  return a.precoBRL - b.precoBRL;
    if (sortBy === "preco_desc") return b.precoBRL - a.precoBRL;
    if (sortBy === "nome_asc")   return a.titulo.localeCompare(b.titulo);
    return 0;
  });

  return (
    <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-violet-700/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-700/6 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Deal<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Hunter</span>
              <span className="text-xs font-normal text-zinc-500 ml-2 align-middle">AI</span>
            </h1>
            <p className="text-zinc-500 text-sm">Monitoramento inteligente de preços</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 bg-zinc-900/80 border border-zinc-800 rounded-full px-3 py-1.5">
              {meta?.total ?? sorted.length} produtos
            </span>
            <button
              onClick={handleScrapeAll}
              disabled={scrapingAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 active:scale-95"
            >
              {scrapingAll ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Atualizando...</>
              ) : "🔄 Atualizar todos"}
            </button>
          </div>
        </div>
      </header>

      <section
        className="max-w-6xl mx-auto px-6 py-8 space-y-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.4s ease",
        }}
      >

        {/* Adicionar por URL */}
        <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-600/8 via-indigo-600/5 to-transparent p-6 space-y-4">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
          <div>
            <p className="text-sm font-bold text-white">🎯 Monitorar novo produto</p>
            <p className="text-xs text-zinc-500 mt-0.5">Cole a URL do produto que deseja acompanhar</p>
          </div>
          <div className="flex gap-3">
            <input
              type="url"
              placeholder="https://fake-ecommerce-five.vercel.app/..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              className="flex-1 bg-black/40 border border-white/10 hover:border-violet-500/40 focus:border-violet-500/60 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
            <button
              onClick={handleAddUrl}
              disabled={addingUrl || !newUrl.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap hover:shadow-lg hover:shadow-violet-500/25"
            >
              {addingUrl ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adicionando...</>
              ) : "+ Adicionar"}
            </button>
          </div>
          {urlMsg && (
            <p className={`text-xs px-3 py-2 rounded-lg border ${urlMsg.ok ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
              {urlMsg.text}
            </p>
          )}
        </div>

        {scrapeMsg && (
          <p className="text-xs text-zinc-300 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3">{scrapeMsg}</p>
        )}

        {/* Busca e ordenação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500/50 text-zinc-100 placeholder-zinc-600 rounded-xl pl-11 pr-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none cursor-pointer"
          >
            <option value="default">Ordenar: Padrão</option>
            <option value="preco_asc">Menor preço</option>
            <option value="preco_desc">Maior preço</option>
            <option value="nome_asc">Nome A→Z</option>
          </select>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-zinc-900/60 border border-zinc-800/60">
                <Skeleton className="h-56 w-full bg-zinc-800/60" />
                <div className="p-4 space-y-2.5">
                  <Skeleton className="h-4 w-3/4 bg-zinc-800/60" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800/60" />
                  <Skeleton className="h-7 w-2/3 bg-zinc-800/60 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-center py-20 text-zinc-500">{error}</div>}

        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-24 space-y-3">
            <p className="text-5xl">📦</p>
            <p className="text-zinc-500">{search ? "Nenhum produto encontrado." : "Adicione um produto pela URL acima."}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((product, index) => {
              const lastHistory = product.history?.[0];
              const variacao    = calcVariacao(product);
              const subiu       = variacao !== null && variacao > 0;
              const desceu      = variacao !== null && variacao < 0;

              return (
                <Link key={product.id} href={`/products/${product.id}`} prefetch={false}>
                  <div
                    className="group relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 hover:border-violet-500/50 cursor-pointer h-full flex flex-col"
                    style={{
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      animation: `fadeUp 0.4s ease ${index * 0.04}s both`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px) scale(1.01)";
                      e.currentTarget.style.boxShadow = "0 24px 48px rgba(139,92,246,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* linha topo hover */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/0 to-transparent group-hover:via-violet-500/70 transition-all duration-500" />

                    {/* Imagem */}
                    <div className="relative h-56 bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 flex items-center justify-center overflow-hidden">
                      {product.imagem ? (
                        <img
                          src={product.imagem}
                          alt={product.titulo}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-zinc-600 text-sm">Sem imagem</span>
                      )}

                      {/* Badge variação */}
                      {variacao !== null && (
                        <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                          subiu  ? "text-red-400 bg-red-950/90 border-red-500/40" :
                          desceu ? "text-emerald-400 bg-emerald-950/90 border-emerald-500/40" :
                                   "text-zinc-400 bg-zinc-950/90 border-zinc-700/40"
                        }`}>
                          {subiu ? "▲" : desceu ? "▼" : "●"} {subiu ? "+" : ""}{variacao.toFixed(1)}%
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col p-4 space-y-3">
                      <p className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {product.titulo}
                      </p>

                      {product.rating && (
                        <p className="text-xs text-amber-400/70">★ {product.rating}</p>
                      )}

                      <div className="mt-auto">
                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                          {product.precoBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">USD ${product.precoUSD?.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                          lastHistory
                            ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                            : "text-zinc-600 bg-zinc-800/40 border-zinc-700/40"
                        }`}>
                          {lastHistory ? "✓ Analisado" : "Pendente"}
                        </span>
                        <span className="text-xs text-zinc-700">
                          {lastHistory ? new Date(lastHistory.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm border border-zinc-800 text-zinc-400 hover:border-violet-500/50 hover:text-violet-400 disabled:opacity-25 transition-all duration-200"
            >← Anterior</button>

            {Array.from({ length: meta.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200 ${
                  page === i + 1
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 border-0"
                    : "border border-zinc-800 text-zinc-500 hover:border-violet-500/50 hover:text-violet-400"
                }`}
              >{i + 1}</button>
            ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.totalPages}
              className="px-4 py-2 rounded-xl text-sm border border-zinc-800 text-zinc-400 hover:border-violet-500/50 hover:text-violet-400 disabled:opacity-25 transition-all duration-200"
            >Próximo →</button>
          </div>
        )}
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import api from "@/app/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://dealhunter-ai-production.up.railway.app";
const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });

function stepColor(message) {
  if (message.includes("✅")) return "text-emerald-400";
  if (message.includes("❌")) return "text-red-400";
  if (message.includes("💱")) return "text-cyan-400";
  if (message.includes("💾")) return "text-yellow-400";
  return "text-zinc-300";
}

function trendConfig(trend) {
  if (trend === "up")   return { icon: "📈", color: "text-red-400",     label: "Alta",    bg: "from-red-500/20 to-red-500/5 border-red-500/30" };
  if (trend === "down") return { icon: "📉", color: "text-emerald-400", label: "Baixa",   bg: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" };
  return                       { icon: "➡️", color: "text-zinc-400",    label: "Estável", bg: "from-zinc-500/20 to-zinc-500/5 border-zinc-500/30" };
}

function sentimentConfig(sentiment) {
  if (sentiment === "positive") return { icon: "😊", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" };
  if (sentiment === "negative") return { icon: "😟", color: "text-red-400",     bg: "from-red-500/20 to-red-500/5 border-red-500/30" };
  return                               { icon: "😐", color: "text-zinc-400",    bg: "from-zinc-500/20 to-zinc-500/5 border-zinc-500/30" };
}

const reviewNames     = ["Ana S.", "Carlos M.", "Julia R.", "Pedro L.", "Mariana T.", "Rafael O.", "Beatriz F.", "Lucas N."];
const reviewStars     = [5, 4, 5, 4, 5, 3, 5, 4];
const reviewDaysAgo   = [2, 5, 8, 12, 15, 20, 25, 30];
const reviewGradients = [
  "from-violet-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
];

export default function ProductDetails() {
  const { id } = useParams();
  const router  = useRouter();

  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [scraping, setScraping]   = useState(false);
  const [error, setError]         = useState(null);
  const [logs, setLogs]           = useState([]);
  const [mounted, setMounted]     = useState(false);
  const [aiData, setAiData]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState(null);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  async function fetchProduct() {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch { setError("Erro ao carregar produto."); }
    finally { setLoading(false); }
  }

  async function fetchAiAnalysis() {
    try {
      setAiLoading(true);
      setAiError(null);
      const { data } = await api.get(`/products/${id}/analyze`);
      setAiData(data);
    } catch { setAiError("Erro ao gerar análise de IA."); }
    finally { setAiLoading(false); }
  }

  useEffect(() => {
    if (id) fetchProduct();
    socket.on("connect", () => console.log("[socket] conectado"));
    socket.on("scraping:status", (data) => {
      setLogs((prev) => [...prev, data.message]);
      if (data.step === "done")  { setScraping(false); fetchProduct(); }
      if (data.step === "error") setScraping(false);
    });
    return () => { socket.off("scraping:status"); socket.off("connect"); };
  }, [id]);

  async function handleScrape() {
    setLogs([]);
    setScraping(true);
    try {
      await api.post(`/products/${id}/scrape`);
    } catch {
      setLogs((prev) => [...prev, "❌ Erro ao conectar com o servidor."]);
      setScraping(false);
    }
  }

  function formatBRL(value) {
    return value?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getVariacao() {
    const h = product?.history || [];
    if (h.length < 2) return null;
    return ((h[h.length - 1].preco - h[h.length - 2].preco) / h[h.length - 2].preco) * 100;
  }

  const chartData = product?.history?.map((item) => ({
    data:  new Date(item.createdAt).toLocaleDateString("pt-BR"),
    preco: item.preco,
  })) || [];

  if (loading) return (
    <main className="min-h-screen bg-[#080810] text-white px-6 py-10 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-6 w-32 bg-zinc-800/60" />
      <Skeleton className="h-[500px] w-full bg-zinc-800/60 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48 bg-zinc-800/60 rounded-2xl" />
        <Skeleton className="h-48 bg-zinc-800/60 rounded-2xl" />
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
      <p className="text-zinc-500">{error}</p>
    </main>
  );

  if (!product) return null;

  const variacao = getVariacao();
  const reviews  = product.reviews || [];

  return (
    <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-700/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-700/8 rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-zinc-400 hover:text-violet-400 text-sm transition-all duration-200 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200 inline-block">←</span>
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-base font-bold tracking-tight">
              Deal<span className="text-violet-400">Hunter</span>
              <span className="text-xs font-normal text-zinc-500 ml-1">AI</span>
            </span>
          </div>
        </div>
      </header>

      <section
        className="max-w-5xl mx-auto px-6 py-10 space-y-5"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s ease",
        }}
      >
        {/* HERO */}
        <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-sm">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/80 to-transparent" />
          <div className="flex flex-col md:flex-row">

            <div className="relative md:w-[460px] md:min-h-[420px] h-72 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-indigo-600/5" />
              {product.imagem ? (
                <img
                  src={product.imagem}
                  alt={product.titulo}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-zinc-600 text-sm">Sem imagem</span>
                </div>
              )}
              <div className="hidden md:block absolute right-0 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
            </div>

            <div className="flex-1 p-8 md:p-10 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Monitorado
                </span>
                <span className="text-xs text-zinc-600">{new Date(product.createdAt).toLocaleString("pt-BR")}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{product.titulo}</h1>

              {product.rating && (
                <p className="text-sm text-amber-400/80 flex items-center gap-1">
                  ★ <span className="text-zinc-400">{product.rating}</span>
                </p>
              )}

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Preço atual</p>
                <div className="flex items-end gap-3 flex-wrap">
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400">
                    {formatBRL(product.precoBRL)}
                  </p>
                  {variacao !== null && (
                    <span className={`mb-2 text-sm font-bold px-3 py-1 rounded-full border ${
                      variacao > 0 ? "text-red-400 bg-red-500/10 border-red-500/25" :
                      variacao < 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" :
                      "text-zinc-400 bg-zinc-500/10 border-zinc-500/25"
                    }`}>
                      {variacao > 0 ? "▲" : variacao < 0 ? "▼" : "●"} {variacao > 0 ? "+" : ""}{variacao.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mt-1">USD ${product.precoUSD?.toFixed(2)}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {product.url && ( 
                  <a 
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-violet-500/60 hover:text-violet-300 hover:bg-violet-500/5 text-xs font-medium transition-all duration-200"
                  >
                    🔗 Ver produto original
                  </a>
                )}
                <button
                  onClick={handleScrape}
                  disabled={scraping}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 active:scale-95"
                >
                  {scraping ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Coletando...</>
                  ) : "⚡ Atualizar este produto"}
                </button>
              </div>

              {logs.length > 0 && (
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Status da coleta</p>
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                      <p className={`text-xs font-mono ${stepColor(log)}`}>{log}</p>
                    </div>
                  ))}
                  {scraping && (
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
                      <p className="text-xs font-mono text-violet-400 animate-pulse">Processando...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        {reviews.length > 0 && (
          <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 overflow-hidden">
            <div className="px-7 py-6 border-b border-white/5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center text-lg">⭐</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Avaliações dos Clientes</h3>
                    <p className="text-xs text-zinc-500">{reviews.length} avaliação(ões) verificada(s)</p>
                  </div>
                </div>
                {product.rating && (
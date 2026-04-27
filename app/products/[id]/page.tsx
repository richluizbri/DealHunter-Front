"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import api from "@/app/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const socket = io("https://dealhunter-ai-production.up.railway.app");

function stepColor(message) {
  if (message.includes("✅")) return "text-emerald-400";
  if (message.includes("❌")) return "text-red-400";
  if (message.includes("💱")) return "text-blue-400";
  if (message.includes("💾")) return "text-yellow-400";
  return "text-zinc-300";
}

// Ícone e cor baseados na tendência de preço retornada pela IA
function trendConfig(trend) {
  if (trend === "up")     return { icon: "📈", color: "text-red-400",     label: "Alta" };
  if (trend === "down")   return { icon: "📉", color: "text-emerald-400", label: "Baixa" };
  return                         { icon: "➡️", color: "text-zinc-400",    label: "Estável" };
}

// Ícone e cor baseados no sentimento das avaliações
function sentimentConfig(sentiment) {
  if (sentiment === "positive") return { icon: "😊", color: "text-emerald-400" };
  if (sentiment === "negative") return { icon: "😟", color: "text-red-400" };
  return                               { icon: "😐", color: "text-zinc-400" };
}

export default function ProductDetails() {
  const { id } = useParams();
  const router  = useRouter();

  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [scraping, setScraping]     = useState(false);
  const [error, setError]           = useState(null);
  const [logs, setLogs]             = useState([]);

  // Estado da análise de IA
  const [aiData, setAiData]         = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState(null);

  async function fetchProduct() {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch {
      setError("Erro ao carregar produto.");
    } finally {
      setLoading(false);
    }
  }

  // Chama a rota de IA do backend
  async function fetchAiAnalysis() {
    try {
      setAiLoading(true);
      setAiError(null);
      const { data } = await api.get(`/products/${id}/analyze`);
      setAiData(data);
    } catch {
      setAiError("Erro ao gerar análise de IA.");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchProduct();
    socket.on("scraping:status", (data) => {
      setLogs((prev) => [...prev, data.message]);
      if (data.step === "done") { setScraping(false); fetchProduct(); }
      if (data.step === "error") setScraping(false);
    });
    return () => { socket.off("scraping:status"); };
  }, [id]);

  async function handleScrape() {
    setLogs([]);
    setScraping(true);
    try {
      await api.post("/products/scrape");
    } catch {
      setLogs((prev) => [...prev, "❌ Erro ao conectar com o servidor."]);
      setScraping(false);
    }
  }

  function formatChartData(history) {
    return history.map((item) => ({
      data:  new Date(item.createdAt).toLocaleDateString("pt-BR"),
      preco: item.preco,
    }));
  }

  function formatBRL(value) {
    return value?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getVariacao() {
    const h = product?.history || [];
    if (h.length < 2) return null;
    const atual    = h[h.length - 1].preco;
    const anterior = h[h.length - 2].preco;
    return ((atual - anterior) / anterior) * 100;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white px-6 py-10 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32 bg-zinc-800" />
        <div className="flex gap-8">
          <Skeleton className="h-56 w-56 bg-zinc-800 rounded-xl shrink-0" />
          <div className="flex-1 space-y-4 pt-2">
            <Skeleton className="h-7 w-3/4 bg-zinc-800" />
            <Skeleton className="h-12 w-1/3 bg-zinc-800" />
            <Skeleton className="h-4 w-1/2 bg-zinc-800" />
            <Skeleton className="h-9 w-40 bg-zinc-800" />
          </div>
        </div>
        <Skeleton className="h-72 w-full bg-zinc-800 rounded-xl" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-500 text-lg">{error}</p>
      </main>
    );
  }

  const chartData = formatChartData(product.history || []);
  const variacao  = getVariacao();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white text-sm transition-colors">
            ← Voltar
          </button>
          <span className="text-lg font-bold tracking-tight">
            Deal<span className="text-violet-500">Hunter</span> AI
          </span>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Card principal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-8 items-start">
          <div className="w-full sm:w-52 h-52 bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            {product.imagem ? (
              <img src={product.imagem} alt={product.titulo} style={{ maxWidth: "170px", maxHeight: "170px" }} className="object-contain" />
            ) : (
              <span className="text-zinc-600 text-sm">Sem imagem</span>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100 leading-snug">{product.titulo}</h2>
            {product.rating && <p className="text-sm text-zinc-400">⭐ {product.rating}</p>}

            <div className="space-y-1">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Preço atual</p>
              <p className="text-4xl font-bold text-violet-400">{formatBRL(product.precoBRL)}</p>
              <p className="text-sm text-zinc-500">USD: ${product.precoUSD?.toFixed(2)}</p>
              {variacao !== null && (
                <p className={`text-sm font-medium ${variacao > 0 ? "text-red-400" : variacao < 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                  {variacao > 0 ? "▲" : variacao < 0 ? "▼" : "●"}{" "}
                  {variacao > 0 ? "+" : ""}{variacao.toFixed(1)}% desde a última coleta
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">✓ Monitorado</Badge>
              <span className="text-xs text-zinc-600">Atualizado em {new Date(product.createdAt).toLocaleString("pt-BR")}</span>
            </div>

            {product.url && (
              <a href={product.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                🔗 Ver produto original
              </a>
            )}

            <div className="flex items-center gap-3 flex-wrap mt-2">
              {product.url && (
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-violet-400 text-xs font-medium transition-all">
                  🔗 Ver produto original
                </a>
              )}
              <Button onClick={handleScrape} disabled={scraping} className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                {scraping ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Coletando...
                  </>
                ) : "⚡ Disparar nova coleta"}
              </Button>
            </div>

            {logs.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-1.5 mt-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Status da coleta</p>
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    <p className={`text-xs font-mono ${stepColor(log)}`}>{log}</p>
                  </div>
                ))}
                {scraping && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
                    <p className="text-xs font-mono text-violet-400 animate-pulse">Aguardando...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seção de IA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Análise de IA</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Insights gerados por inteligência artificial</p>
            </div>
            <Button
              onClick={fetchAiAnalysis}
              disabled={aiLoading}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-zinc-700"
            >
              {aiLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
                  Analisando...
                </>
              ) : "🤖 Gerar análise"}
            </Button>
          </div>

          {/* Erro da IA */}
          {aiError && (
            <p className="text-xs text-red-400">{aiError}</p>
          )}

          {/* Resultado da IA */}
          {aiData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Análise de preços */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{trendConfig(aiData.priceAnalysis.trend).icon}</span>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Tendência de preço</p>
                    <p className={`text-sm font-semibold ${trendConfig(aiData.priceAnalysis.trend).color}`}>
                      {trendConfig(aiData.priceAnalysis.trend).label}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{aiData.priceAnalysis.summary}</p>
                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500 mb-1">Recomendação</p>
                  <p className="text-xs text-violet-300 leading-relaxed">{aiData.priceAnalysis.recommendation}</p>
                </div>
                {aiData.priceAnalysis.insight && (
                  <div className="border-t border-zinc-800 pt-3">
                    <p className="text-xs text-zinc-500 mb-1">Insight</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{aiData.priceAnalysis.insight}</p>
                  </div>
                )}
              </div>

              {/* Análise de sentimento */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sentimentConfig(aiData.ratingAnalysis.sentiment).icon}</span>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Sentimento das avaliações</p>
                    <p className={`text-sm font-semibold ${sentimentConfig(aiData.ratingAnalysis.sentiment).color}`}>
                      {aiData.ratingAnalysis.label}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{aiData.ratingAnalysis.description}</p>
                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500 mb-1">Avaliação registrada</p>
                  <p className="text-xs text-zinc-400">⭐ {product.rating || "Sem avaliações"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado vazio — antes de gerar */}
          {!aiData && !aiLoading && !aiError && (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-600 space-y-2">
              <p className="text-3xl">🤖</p>
              <p className="text-sm">Clique em "Gerar análise" para obter insights de IA</p>
              <p className="text-xs">Analisa tendência de preços e sentimento das avaliações</p>
            </div>
          )}
        </div>

        {/* Gráfico */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Histórico de Preços</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Flutuação em BRL ao longo do tempo</p>
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
              {chartData.length} registro(s)
            </Badge>
          </div>

          {chartData.length < 2 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-600 space-y-2">
              <p className="text-3xl">📊</p>
              <p className="text-sm">Dados insuficientes para o gráfico.</p>
              <p className="text-xs">Dispare mais coletas para visualizar a flutuação.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="data" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "10px", color: "#fff" }}
                  formatter={(value) => [formatBRL(value), "Preço"]}
                />
                <Line type="monotone" dataKey="preco" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6, fill: "#a78bfa" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </main>
  );
}
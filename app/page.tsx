"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "./lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function calcVariacao(product) {
  const history = product.history || [];
  if (history.length < 2) return null;
  const atual    = history[0].preco;
  const anterior = history[1].preco;
  return ((atual - anterior) / anterior) * 100;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("default");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await api.get("/products");
        setProducts(data.products || []);
      } catch {
        setError("Erro ao carregar produtos.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filtered = products.filter((p) =>
    p.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "preco_asc")  return a.precoBRL - b.precoBRL;
    if (sortBy === "preco_desc") return b.precoBRL - a.precoBRL;
    if (sortBy === "nome_asc")   return a.titulo.localeCompare(b.titulo);
    return 0;
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Deal<span className="text-violet-500">Hunter</span> AI
            </h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              Monitoramento inteligente de preços
            </p>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {sorted.length} produto(s) encontrado(s)
          </Badge>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="default">Ordenar: Padrão</option>
            <option value="preco_asc">Menor preço</option>
            <option value="preco_desc">Maior preço</option>
            <option value="nome_asc">Nome A→Z</option>
          </select>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <Skeleton className="h-48 w-full bg-zinc-800" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">{error}</p>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">Nenhum produto encontrado.</p>
            <p className="text-sm mt-1">
              {search ? "Tente outro termo de busca." : "Dispare uma nova coleta pelo backend."}
            </p>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sorted.map((product) => {
              const lastHistory = product.history?.[0];
              const hasHistory  = !!lastHistory;
              const variacao    = calcVariacao(product);
              const subiu       = variacao > 0;
              const desceu      = variacao < 0;

              return (
                <Link key={product.id} href={`/products/${product.id}`} prefetch={false}>
                  <Card className="bg-zinc-900 border border-zinc-800 hover:border-violet-500 transition-all duration-200 cursor-pointer group rounded-xl overflow-hidden h-full">
                    <div className="h-48 bg-zinc-800 overflow-hidden flex items-center justify-center">
                      {product.imagem ? (
                        <img
                          src={product.imagem}
                          alt={product.titulo}
                          className="max-w-full max-h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="text-zinc-600 text-sm">Sem imagem</div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
                        {product.titulo}
                      </p>

                      {product.rating && (
                        <p className="text-xs text-zinc-400">⭐ {product.rating}</p>
                      )}

                      <div>
                        <p className="text-xl font-bold text-violet-400">
                          {product.precoBRL.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        {variacao !== null && (
                          <p className={`text-xs font-medium mt-0.5 ${subiu ? "text-red-400" : desceu ? "text-emerald-400" : "text-zinc-500"}`}>
                            {subiu ? "▲" : desceu ? "▼" : "●"}{" "}
                            {subiu ? "+" : ""}{variacao.toFixed(1)}% desde a última coleta
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={hasHistory ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"}>
                          {hasHistory ? "✓ Analisado" : "Pendente"}
                        </Badge>
                        <span className="text-xs text-zinc-600">
                          {hasHistory ? new Date(lastHistory.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
# DealHunter AI — Frontend

Interface web para monitoramento inteligente de preços de e-commerce com análise por inteligência artificial.

##  Tecnologias
- **Next.js 16** — Framework React
- **Tailwind CSS** — Estilização
- **Shadcn UI** — Componentes de interface
- **Axios** — Consumo da API
- **Recharts** — Gráficos de histórico de preços
- **Socket.io Client** — Feedback em tempo real

##  Telas

### Listagem de Produtos
- Cards com imagem, título e preço em BRL
- Variação de preço desde a última coleta (▲▼)
- Rating/avaliação do produto
- Badge de status da última análise
- Busca por nome
- Ordenação por preço e nome

### Detalhes do Produto
- Dados completos do produto
- Preço em BRL e USD
- Botão para disparar nova coleta
- Feedback em tempo real via WebSocket durante a coleta
- Gráfico de flutuação de preços ao longo do tempo
- Análise de IA com tendência de preço e sentimento das avaliações
- Link para o produto original

##  Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Backend rodando em `http://localhost:3001`

### Instalação
```bash
git clone https://github.com/richluizbri/DealHunter-Front
cd DealHunter-Front
npm install
```

### Configuração
Abre `app/lib/api.js` e confirma que a URL aponta para o backend:
```javascript
baseURL: "http://localhost:3001/api"
```

### Iniciar
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## 🌐 Deploy
- **Frontend:** [Vercel](https://deal-hunter-front.vercel.app)
- **Backend:** [Railway](https://dealhunter-ai-production.up.railway.app)

## Estrutura
app/
  lib/
    api.js              # Configuração do Axios e baseURL
  products/
    [id]/
      page.tsx          # Página de detalhes do produto
  page.tsx              # Página de listagem de produtos
  globals.css           # Estilos globais
  layout.tsx            # Layout principal
components/
  ui/
    badge.tsx           # Componente de badge de status
    button.tsx          # Componente de botão
    card.tsx            # Componente de card de produto
    skeleton.tsx        # Componente de loading skeleton
lib/
  utils.ts              # Funções utilitárias (cn, clsx)

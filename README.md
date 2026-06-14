# 🌱 Smart Root — App do Cliente (PWA)

App do cliente do sistema de irrigação automatizada. Feito em **React + Vite**, instalável
como **PWA** (Progressive Web App) no celular. O cliente faz login, gerencia seus jardins,
liga/desliga a irrigação, define horários e abre chamados.

---

## Pré-requisitos
- **Node.js 18+** (recomendado 20) e **npm** — verifique com `node -v` e `npm -v`.
- O **backend** (API FastAPI) rodando — por padrão em `http://127.0.0.1:8000`.
  Sem ele, o app abre mas o login/dados não funcionam.

## Passo a passo — rodar localmente

### 1. Instalar as dependências
Na pasta do projeto:
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O app sobe em **http://localhost:5173**. O terminal fica "parado" rodando o servidor —
isso é o esperado. Para parar, `Ctrl+C`.

> **Como ele fala com o backend:** em desenvolvimento, todas as chamadas a `/api` são
> redirecionadas para `http://127.0.0.1:8000` por um proxy do Vite (ver `vite.config.js`).
> Por isso você **não** precisa configurar nada para o ambiente local — basta o backend
> estar de pé.

### 3. Acessar
Abra **http://localhost:5173** no navegador. Para um cliente de teste (se o backend tiver o
seed padrão), use `pedro@teste.com` / `senha123` — ou cadastre uma conta nova (ela nasce
"pendente" até o admin aprovar).

---

## Acessar pelo celular (mesma rede Wi-Fi)
O `vite.config.js` já está com `host: true`, então o Vite também serve no IP da máquina
(ex.: `http://10.0.0.4:5173`). Abra esse endereço no celular conectado na mesma rede.
(No Windows, talvez seja necessário liberar a porta 5173 no firewall.)

---

## Build de produção
```bash
npm run build      # gera a pasta dist/ (com service worker + manifest do PWA)
npm run preview    # serve o build localmente para conferir (porta 4173)
```
A instalação como PWA (ícone na tela inicial, offline) só funciona no **build de produção
servido por HTTPS** — não no `npm run dev`.

---

## Deploy (Vercel)
O projeto está pronto para a Vercel (`vercel.json` já incluído). Ao importar o repositório:

1. **Framework:** Vite (detectado automaticamente). Build `npm run build`, saída `dist`.
2. **Variável de ambiente** (Settings → Environment Variables), marcada para **Production**:
   ```
   VITE_API_URL = https://URL_PUBLICA_DO_BACKEND
   ```
   É a URL pública da API (um VPS, ou um túnel ngrok para testes). Sem ela, o app usa o
   fallback `/api`, que só funciona no ambiente local.
3. **Importante:** variável de ambiente só entra em um **build novo**. Depois de adicioná-la,
   faça um *Redeploy* (ou um novo push).

---

## Estrutura
```
src/
├── main.jsx              ponto de entrada
├── App.jsx               rotas (react-router)
├── api.js                camada de acesso ao backend (lê VITE_API_URL)
├── auth.jsx              contexto de autenticação (JWT no localStorage)
├── components/Layout.jsx cabeçalho + navegação
└── pages/                Login, Register, Gardens, GardenDetail, Tickets
```

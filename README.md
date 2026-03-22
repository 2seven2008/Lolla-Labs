# Lolla Labs — Digital Casting Platform

PWA de casting digital para modelos enviarem looks para análise de agentes.

---

## Stack

| Camada            | Tecnologia                            |
| ----------------- | ------------------------------------- |
| Frontend          | HTML5, CSS3, JavaScript (Vanilla)     |
| Backend           | Vercel Serverless Functions (Node.js) |
| Banco de dados    | MongoDB Atlas (não relacional)        |
| Upload de imagens | Cloudinary                            |
| Autenticação      | JWT + bcryptjs                        |
| PWA               | Service Worker + Web App Manifest     |
| Deploy            | Vercel                                |

---

## Estrutura do projeto

```
lolla-labs/
├── api/                     # Serverless functions (Vercel)
│   ├── enviar-look.js       # POST  /api/enviar-look
│   ├── looks.js             # GET   /api/looks
│   ├── login.js             # POST  /api/login
│   └── analisar-look.js     # PATCH /api/analisar-look
├── css/
│   └── style.css            # Estilos globais (mobile-first)
├── js/
│   ├── app.js               # PWA + utilitários (toasts, loader)
│   ├── api.js               # Cliente HTTP
│   └── auth.js              # Helpers de autenticação
├── lib/
│   ├── mongodb.js           # Conexão MongoDB
│   └── cloudinary.js        # Upload de imagens
├── pages/
│   ├── index.html           # Landing page
│   ├── enviar-look.html     # Formulário do modelo
│   ├── login.html           # Login dos agentes
│   └── agentes.html         # Painel dos agentes
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker
├── .env.example             # Variáveis de ambiente necessárias
├── vercel.json              # Configuração de rotas e headers
└── package.json
```

---

## Pré-requisitos

- Node.js 18+
- Conta no [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuito)
- Conta no [Cloudinary](https://cloudinary.com) (gratuito)
- CLI do [Vercel](https://vercel.com/cli): `npm i -g vercel`

---

## Como rodar localmente

```bash
# 1. Clone ou extraia o projeto
cd lolla-labs

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com seus valores reais

# 4. Rode em modo de desenvolvimento
vercel dev
```

Acesse: `http://localhost:3000`

---

## Deploy no Vercel

### Opção 1 — Via CLI (recomendado)

```bash
# Login no Vercel
vercel login

# Deploy de produção
vercel --prod
```

### Opção 2 — Via GitHub

1. Faça push do projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → "New Project"
3. Importe o repositório
4. Configure as variáveis de ambiente (passo abaixo)
5. Clique em "Deploy"

### Configurando variáveis de ambiente no Vercel

No dashboard do Vercel → Settings → Environment Variables, adicione:

| Variável                | Valor                                  |
| ----------------------- | -------------------------------------- |
| `MONGODB_URI`           | String de conexão do MongoDB Atlas     |
| `MONGODB_DB`            | `lolla-labs`                           |
| `CLOUDINARY_CLOUD_NAME` | Seu cloud name                         |
| `CLOUDINARY_API_KEY`    | Sua API key                            |
| `CLOUDINARY_API_SECRET` | Seu API secret                         |
| `JWT_SECRET`            | String aleatória forte (mín. 32 chars) |
| `JWT_EXPIRES`           | `8h`                                   |

---

## Configurando MongoDB Atlas

1. Crie um cluster gratuito (M0) em [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Em **Database Access**: crie um usuário com senha
3. Em **Network Access**: adicione `0.0.0.0/0` (permite acesso do Vercel)
4. Em **Connect** → "Connect your application": copie a connection string
5. Substitua `<password>` pela senha do usuário na URI

A coleção `looks` é criada automaticamente no primeiro envio.

---

## Configurando Cloudinary

1. Crie conta gratuita em [cloudinary.com](https://cloudinary.com)
2. No Dashboard, copie: **Cloud Name**, **API Key**, **API Secret**
3. O plano gratuito oferece 25GB de armazenamento e 25GB de bandwidth/mês

---

## Endpoints da API

### POST `/api/enviar-look`

Envia um novo look. Aceita `multipart/form-data`.

**Campos:**

```
nome        string  obrigatório
altura      number  obrigatório  (140–220)
cidade      string  obrigatório
categoria   string  obrigatório  (street|fashion|casual|sport|formal|editorial|swimwear|outro)
descricao   string  obrigatório  (máx 500 chars)
imagem      file    obrigatório  (JPG/PNG/WebP, máx 10MB)
```

**Exemplo com curl:**

```bash
curl -X POST https://seu-projeto.vercel.app/api/enviar-look \
  -F "nome=Ana Lima" \
  -F "altura=175" \
  -F "cidade=São Paulo" \
  -F "categoria=street" \
  -F "descricao=Look urbano com jaqueta oversized e tênis chunky" \
  -F "imagem=@/caminho/para/foto.jpg"
```

**Resposta 201:**

```json
{
  "success": true,
  "id": "64f3a1b2c3d4e5f6a7b8c9d0",
  "message": "Look enviado com sucesso! Nossa equipe irá analisar em breve."
}
```

---

### POST `/api/login`

Autentica um agente e retorna JWT.

**Body:**

```json
{
  "email": "agente@lollalabs.com",
  "password": "lolla2025"
}
```

**Resposta 200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "agente@lollalabs.com",
  "name": "Agente Lolla",
  "expiresIn": "8h"
}
```

**Exemplo com curl:**

```bash
curl -X POST https://seu-projeto.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agente@lollalabs.com","password":"lolla2025"}'
```

---

### GET `/api/looks`

Lista todos os looks. Requer autenticação.

**Headers:**

```
Authorization: Bearer <token>
```

**Query params opcionais:**

```
status     pendente | aprovado | rejeitado
categoria  street | fashion | casual | ...
```

**Exemplo com curl:**

```bash
# Todos os looks
curl https://seu-projeto.vercel.app/api/looks \
  -H "Authorization: Bearer SEU_TOKEN"

# Apenas pendentes
curl "https://seu-projeto.vercel.app/api/looks?status=pendente" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta 200:**

```json
{
  "looks": [
    {
      "_id": "64f3a1b2c3d4e5f6a7b8c9d0",
      "nome": "Ana Lima",
      "altura": 175,
      "cidade": "São Paulo",
      "categoria": "street",
      "descricao": "Look urbano com jaqueta oversized...",
      "imagem_url": "https://res.cloudinary.com/...",
      "data_envio": "2025-03-21T14:30:00.000Z",
      "status": "pendente",
      "comentario_agente": null
    }
  ],
  "total": 1
}
```

---

### PATCH `/api/analisar-look`

Analisa (aprova ou rejeita) um look. Requer autenticação.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "id": "64f3a1b2c3d4e5f6a7b8c9d0",
  "status": "aprovado",
  "comentario_agente": "Excelente composição, cores harmônicas. Aprovado para campanha de verão."
}
```

**Exemplo com curl:**

```bash
curl -X PATCH https://seu-projeto.vercel.app/api/analisar-look \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "id": "64f3a1b2c3d4e5f6a7b8c9d0",
    "status": "aprovado",
    "comentario_agente": "Look aprovado para a próxima campanha."
  }'
```

**Resposta 200:**

```json
{
  "success": true,
  "message": "Look aprovado com sucesso"
}
```

---

## Acesso Demo

| Rota       | Descrição                     |
| ---------- | ----------------------------- |
| `/`        | Landing page                  |
| `/enviar`  | Formulário do modelo          |
| `/login`   | Login dos agentes             |
| `/agentes` | Painel de análise (protegido) |

**Credenciais de agente demo:**

```
Email: agente@lollalabs.com
Senha: lolla2025
```

---

## Adicionando novos agentes

Gere o hash bcrypt da senha no terminal:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('nova_senha', 10))"
```

Configure a variável de ambiente `AGENTS_JSON` no Vercel:

```json
[
  {
    "email": "agente1@lollalabs.com",
    "hash": "$2a$10$HASH_GERADO_AQUI",
    "name": "Agente Um",
    "role": "agent"
  },
  {
    "email": "agente2@lollalabs.com",
    "hash": "$2a$10$OUTRO_HASH",
    "name": "Agente Dois",
    "role": "agent"
  }
]
```

---

## Funcionalidades PWA

- ✅ Instalável como app (Android e iOS)
- ✅ Funciona offline (páginas em cache)
- ✅ Suporte à câmera do celular
- ✅ Upload de imagens da galeria
- ✅ Service Worker com estratégia cache-first
- ✅ Manifest com ícones e cores da marca

---

## Checklist de deploy

- [ ] MongoDB Atlas criado e URI configurada
- [ ] Cloudinary configurado
- [ ] Variáveis de ambiente definidas no Vercel
- [ ] `JWT_SECRET` com string forte (não usar o valor de exemplo)
- [ ] Deploy realizado com `vercel --prod`
- [ ] Testar envio de look em produção
- [ ] Testar login e painel de agentes
- [ ] Instalar PWA no celular e testar offline

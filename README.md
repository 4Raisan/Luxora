# Steam Wishlist Monitor & Customizer (SteamA)

SteamA is a full-stack application for tracking Steam wishlist prices, organizing games with custom drag-and-drop categories, and sending WhatsApp alerts when prices hit all-time lows.

## Stack

- **Backend**: Node.js, Express, Prisma ORM, SQLite, node-cron
- **Frontend**: Vite, React, Vanilla CSS
- **Integrations**: Steam wishlist APIs, CheapShark, WhatsApp Web (with mock mode)

## Monorepo Structure

```
/backend
  /src
    /services
      steamService.js
      whatsappService.js
    /jobs
      cronJob.js
    server.js
  /prisma
    schema.prisma
  package.json
  .env.example

/frontend
  /src
    /pages
      Dashboard.jsx
      Auth.jsx
    /components
      CategorySidebar.jsx
    App.jsx
    index.css
  /public
  package.json
  vite.config.js
  index.html
```

## Setup

1. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure backend environment:

```bash
cp backend/.env.example backend/.env
```

3. Generate Prisma client and migrate:

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev --name init
```

4. Start services:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:4000`.

## API Highlights

- `POST /api/auth/register` / `POST /api/auth/login`
- `GET /api/profile` and `PUT /api/profile/steam`
- `POST /api/wishlist/sync` to fetch Steam wishlist and CheapShark ATL data
- `GET /api/games?sortBy=atl|discount|price|name&order=asc|desc`
- Category endpoints: `GET/POST/PUT/DELETE /api/categories`, `POST /api/categories/reorder`

## Verification Checklist

- Register/login flow via curl or frontend Auth page
- Link Steam profile + region and sync wishlist
- Validate all-time low values from CheapShark API
- Create categories and drag games into categories
- Confirm reorder persistence by refreshing dashboard
- Test WhatsApp alerts using `MOCK_WHATSAPP=true` or real client QR flow
- Confirm cron jobs run hourly and daily for price checks

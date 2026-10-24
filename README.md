# InkMap

Find en tatovør efter stil og by, og book en konsultation direkte. Tatovører kan oprette
en profil, uploade motiver og styre deres booking-forespørgsler fra et dashboard.

## Kør projektet lokalt

```bash
npm install
npm run dev
```

Dette starter både frontend (Vite, [http://localhost:5173](http://localhost:5173)) og
API-serveren (Express, port 4000) samtidig. Frontenden proxier `/api` til API-serveren
automatisk — åbn kun `http://localhost:5173`.

Første gang du kører projektet, skal du oprette `server/.env` (kopiér `server/.env.example`)
og udfylde:
- `SESSION_SECRET` — en tilfældig streng, styrer login-sessions
- `DATABASE_URL` — en gratis Postgres-database fra [neon.tech](https://neon.tech)
- `R2_*` — gratis objektlagring fra [Cloudflare R2](https://dash.cloudflare.com) til uploadede billeder

Serveren starter ikke uden `DATABASE_URL`; billede-upload fejler uden `R2_*`, men resten
af siden virker fint.

## Database

Postgres (via `DATABASE_URL`) — en rigtig, persistent database, ikke en lokal fil. Tabellerne
oprettes automatisk ved første opstart. Free-tier Postgres hos Neon udløber ikke, og data
overlever redeploys (modsat en lokal SQLite-fil, som tidligere blev slettet ved hver deploy
på Render).

## Billeder

Uploadede motiver og profilbilleder sendes direkte til Cloudflare R2 — ikke til serverens
lokale disk. Det betyder, de også overlever redeploys. Uden `R2_*` sat fejler upload med en
tydelig fejlbesked; resten af siden (eksempeldata, browsing, booking) virker stadig.

## E-mail

InkMap sender rigtige e-mails ved registrering, booking-forespørgsler, bekræftelse/afvisning
og nulstilling af adgangskode.

Uden konfiguration bruges automatisk et midlertidigt test-mailbox (Ethereal) — hver e-mail
logges i terminalen med et link, hvor du kan se den, uden at noget sendes til en rigtig
indbakke.

For at sende rigtige e-mails: udfyld `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` m.fl. i
`server/.env` med oplysninger fra din e-mail-udbyder (f.eks. Resend, Postmark, SendGrid).

## Deploy

- **Frontend** → GitHub Pages, automatisk via `.github/workflows/deploy.yml` ved push til
  `main`. Kræver repository-variablen `VITE_API_URL` (Settings → Secrets and variables →
  Actions → Variables) sat til backendens URL.
- **Backend** → Render, via `render.yaml` ("New +" → "Blueprint"). Render beder om
  `DATABASE_URL` og `R2_*` ved opsætning. Sæt bagefter `FRONTEND_URL` til den rigtige
  GitHub Pages-origin (uden sti), f.eks. `https://dit-brugernavn.github.io`.

## Struktur

- `src/` — frontend (React + TypeScript + Tailwind)
- `server/` — API (Express)
  - `db.js` — databaselag (Postgres via `pg`)
  - `storage.js` — billede-upload til Cloudflare R2
  - `email.js` — e-mail-afsendelse
  - `seed.js` — eksempeldata til en tom database

## Status — hvad mangler før rigtig drift

- **Betaling**: depositum nævnes i UI'en, men der er ingen rigtig betalingsintegration
  (f.eks. Stripe) endnu — artisten skal selv opkræve depositum uden om platformen.
- **E-mail i produktion**: kræver rigtige SMTP-oplysninger (se ovenfor) — uden dem er
  "afsendte" e-mails kun synlige i terminalen.
- **Juridiske sider**: Vilkår og Privatlivspolitik er udkast — få dem gennemset af en
  jurist, og udfyld evt. virksomhedsoplysninger (CVR m.v.), før siden går i luften.
- **Billedrettigheder**: eksempelprofilerne bruger tilfældige stock-billeder, ikke rigtige
  tatoveringer — skift dem ud, før nogen tatovør bliver bedt om at bruge platformen.
- **Backup**: Neon tager automatiske snapshots på free-tier, men tjek deres aktuelle
  opbevaringspolitik, før platformen bruges i praksis.

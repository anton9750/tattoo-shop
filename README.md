# InkMap

Find en tatovør efter stil og by, og book en konsultation direkte. Tatovører kan oprette
en profil, uploade motiver og styre deres booking-forespørgsler fra et dashboard.

## Kør projektet lokalt

```bash
npm install
npm run dev
```

Dette starter både frontend (Vite, [http://localhost:5173](http://localhost:5173)) og
API-serveren (Express, port 4000) samtidig. Frontenden proxier `/api` og `/uploads` til
API-serveren automatisk — åbn kun `http://localhost:5173`.

Første gang du kører projektet, skal du oprette `server/.env` (kopiér `server/.env.example`)
med en tilfældig `SESSION_SECRET`. Den styrer de sessions, der logger tatovører ind — skift
den, og alle er logget ud.

## Database

Data gemmes i en rigtig SQLite-database (`server/data/inkmap.sqlite`), oprettet automatisk
første gang serveren starter — ingen separat database-server kræves. Filen er ignoreret af
git. Slet den for at starte helt forfra (den seedes igen med 8 eksempel-tatovører).

## E-mail

InkMap sender rigtige e-mails ved registrering, booking-forespørgsler, bekræftelse/afvisning
og nulstilling af adgangskode.

Uden konfiguration bruges automatisk et midlertidigt test-mailbox (Ethereal) — hver e-mail
logges i terminalen med et link, hvor du kan se den, uden at noget sendes til en rigtig
indbakke. Det er perfekt til udvikling, men betyder at tatovører og besøgende reelt ikke
modtager noget.

For at sende rigtige e-mails: udfyld `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` m.fl. i
`server/.env` (se `server/.env.example`) med oplysninger fra din e-mail-udbyder (f.eks.
Resend, Postmark, SendGrid, eller dit domænes egen SMTP).

## Struktur

- `src/` — frontend (React + TypeScript + Tailwind)
- `server/` — API (Express)
  - `db.js` — databaselag (SQLite via Nodes indbyggede `node:sqlite`)
  - `email.js` — e-mail-afsendelse
  - `seed.js` — eksempeldata til en tom database
  - `data/` — SQLite-filen, oprettes automatisk (ignoreret af git)
  - `uploads/` — uploadede billeder, oprettes automatisk (ignoreret af git)

## Status — hvad mangler før rigtig drift

- **Betaling**: depositum nævnes i UI'en, men der er ingen rigtig betalingsintegration
  (f.eks. Stripe) endnu — artisten skal selv opkræve depositum uden om platformen.
- **E-mail i produktion**: kræver rigtige SMTP-oplysninger (se ovenfor) — uden dem er
  "afsendte" e-mails kun synlige i terminalen.
- **Juridiske sider**: Vilkår og Privatlivspolitik er udkast — få dem gennemset af en
  jurist, og udfyld evt. virksomhedsoplysninger (CVR m.v.), før siden går i luften.
- **Billedrettigheder**: eksempelprofilerne bruger tilfældige stock-billeder, ikke rigtige
  tatoveringer — skift dem ud, før nogen tatovør bliver bedt om at bruge platformen.
- **Backup**: SQLite-filen bør sikkerhedskopieres, før platformen bruges i praksis.

# Hypoteční kalkulačka — janfrydl.cz

Jednostránkový lead-magnet web s živou hypoteční kalkulačkou pro Jana Frýdla. Vite + vanilla TypeScript + Tailwind CSS v4, bez frontend frameworku. `api/lead.ts` běží jako Vercel serverless funkce.

Tento návod je psaný i pro netechnického čtenáře — pokud narazíte na termín, který vám nic neříká, přeskočte ho a řiďte se přesně napsanými příkazy.

## 1. Spuštění na počítači (lokální vývoj)

Potřebujete mít nainstalovaný [Node.js](https://nodejs.org) (verze 20 nebo novější).

```bash
npm install
npm run dev
```

Terminál vypíše adresu (obvykle `http://localhost:5173`) — otevřete ji v prohlížeči.

**Důležité:** `npm run dev` spouští jen frontend (Vite), ne serverless funkci `api/lead.ts` — tu umí spustit až Vercel. Aby šlo v lokálním náhledu otestovat celý tok formuláře (odemčení srovnání, děkovná obrazovka), je ve `vite.config.ts` malý vývojářský "mock", který na `/api/lead` odpoví rovnou `{ ok: true }`, aniž by se cokoliv reálně odeslalo — v terminálu, kde běží `npm run dev`, uvidíte řádek `[DEV MOCK] /api/lead přijal poptávku`. Tenhle mock se v produkčním buildu ani po nasazení na Vercel vůbec nepoužije, tam se volá skutečná funkce z `api/lead.ts`.

Pro odzkoušení SKUTEČNÉHO odesílání e-mailu (ne mocku) musíte použít `vercel dev` místo `npm run dev` — ten už serverless funkce spouští opravdově — a mít vyplněný `.env` podle sekce 4 níže:

```bash
npm install -g vercel   # jen jednou
vercel dev
```

### Testy a kontrola typů

```bash
npm run test        # jednorázově spustí testy výpočtů (Vitest)
npm run test:watch  # testy se spouští znovu při každé změně souboru
npx tsc --noEmit     # zkontroluje, že v kódu nejsou typové chyby
```

Testy ověřují především výpočet splátky (`src/lib/hypoteka.ts`) proti známé referenční hodnotě z Hypoindexu (3 500 000 Kč, 25 let, 5,42 % → 21 327 Kč měsíčně).

## 2. Nasazení na Vercel

1. Nahrajte projekt do GitHub repozitáře (nebo GitLab/Bitbucket).
2. Na [vercel.com](https://vercel.com) klikněte na **Add New → Project** a vyberte repozitář. Vercel sám rozpozná, že jde o Vite projekt.
3. V nastavení projektu (**Settings → Environment Variables**) vyplňte proměnné ze sekce 4 níže.
4. Klikněte na **Deploy**. Hotovo — web poběží na `*.vercel.app` adrese, kterou si pak v nastavení domény přesměrujete na `janfrydl.cz`.

Každá další změna v kódu (push do hlavní větve) se nasadí automaticky.

## 3. Struktura projektu

```
index.html            hlavní stránka (hero, kalkulačka, všechny sekce)
gdpr.html              stránka /gdpr
cookies.html           stránka /cookies
src/
  main.ts               propojí všechny části dohromady
  style.css              barvy, písmo, vzhled (Tailwind v4)
  data/sazby.json         SAZBY BANK — sem se chodí měsíčně aktualizovat (viz sekce 5)
  lib/
    hypoteka.ts            výpočet splátky, LTV, formátování čísel + testy
    validace.ts             kontrola jména/telefonu/e-mailu
    kalkulacka.ts            logika kalkulačky (posuvníky, přepočet)
    formular.ts               odeslání formuláře, honeypot, ochrana proti botům
    gate.ts                    odemčení srovnání bank po odeslání
    analytics.ts                Meta Pixel
    consent.ts, cookie-lista.ts  cookie lišta
api/
  lead.ts                serverless funkce — přijme formulář, pošle e-mail/webhook/Meta
public/
  img/                   fotky Jana Frýdla
  fonts/                  písmo Montserrat
```

## 4. Proměnné prostředí (`.env`)

Zkopírujte `.env.example` na `.env` a vyplňte. Stejné hodnoty pak vyplňte i ve Vercelu (**Settings → Environment Variables**).

| Proměnná | K čemu je | Kde ji získat |
|---|---|---|
| `PUBLIC_META_PIXEL_ID` | ID Meta Pixelu pro měření reklam | Meta Events Manager → Zdroje dat → vaše Pixel ID |
| `PUBLIC_PLAUSIBLE_DOMAIN` | volitelná analytika návštěvnosti | jen pokud používáte [Plausible](https://plausible.io) — jinak nechte prázdné |
| `RESEND_API_KEY` | posílání e-mailu s poptávkou | založte si účet na [resend.com](https://resend.com), API klíč v nastavení |
| `LEAD_EMAIL_FROM` | odesílací adresa e-mailu | musí být z domény, kterou v Resendu ověříte (např. `lead@janfrydl.cz`) — návod je přímo v Resendu |
| `LEAD_EMAIL_TO` | kam se poptávky posílají | výchozí `jan.frydl@4fin.cz`, můžete přepsat |
| `LEAD_WEBHOOK_URL` | adresa Make/n8n scénáře, který lead pošle dál do CRM | zkopírujte z webhook kroku ve vašem Make/n8n scénáři |
| `META_CAPI_ACCESS_TOKEN` | odesílání poptávek do Meta i ze serveru (přesnější měření reklam) | Meta Events Manager → Nastavení → Conversions API → vygenerovat token |
| `META_TEST_EVENT_CODE` | jen pro testování Meta eventů, v ostrém provozu nechte prázdné | Meta Events Manager → záložka "Testovat události" |

Web funguje i bez vyplnění všech proměnných — jen se odpovídající část (e-mail, webhook, Meta) neodešle. E-mail a webhook běží nezávisle na sobě, stačí mít funkční aspoň jeden z nich, aby se poptávka doručila.

## 5. Měsíční aktualizace sazeb bank (pro Jana, bez potřeby programování)

Sazby bank se mění a Hypoindex.cz je aktualizuje vždy kolem 5. pracovního dne v měsíci. Aktualizace:

1. Otevřete soubor `src/data/sazby.json` (jde i přímo na GitHubu přes tlačítko tužky/edit, bez instalace čehokoliv).
2. Podívejte se na aktuální čísla na [Hypoindex.cz](https://www.hypoindex.cz) (minimální nabídkové sazby jednotlivých bank).
3. U každé banky přepište čísla `fix1`, `fix3`, `fix5` (sazby pro 1/3/5letou fixaci) podle nových hodnot. Pokud banka danou fixaci nenabízí, napište `null`.
4. Nahoře přepište:
   - `"aktualizovano"` na dnešní datum ve tvaru `RRRR-MM-DD`
   - `"prumerna_nabidkova_sazba"` na aktuální průměrnou sazbu z Hypoindexu
   - `"sazba_kterou_vyjednavam"` na sazbu, kterou aktuálně reálně dokážete klientům vyjednat
5. Soubor uložte (na GitHubu tlačítkem "Commit changes"). Pokud je web nasazený na Vercelu napojeném na GitHub, změna se sama nasadí do pár minut.

Nic jiného v kódu měnit nemusíte — čísla z tohoto souboru se používají všude v kalkulačce i v odemčeném srovnání bank automaticky.

**Formát souboru musí zůstat platný JSON** — každý řádek s číslem musí mít na konci čárku kromě úplně posledního v dané skupině `{ }`. Pokud si nejste jistí, nejbezpečnější je změnit vždy jen samotná čísla a nic jiného (uvozovky, dvojtečky, čárky) neposouvat.

## 6. Co ještě doladit mimo web (důležité, není součástí kódu)

- **Reklamy na Meta cílí na Leads s konverzí na webu** (Pixel `Lead`), ne na Instant Form — u hypoték dává Instant Form levnější, ale výrazně méně kvalitní leady.
- **Kampaň může spadnout do Special Ad Category (credit)** kvůli povaze finančního produktu i kalkulačce ve vizuálu — to znamená povinné cílení 18+, zmizí lookalike publika a zúží se možnosti cílení. Ověřte si to v Ads Manageru ještě před spuštěním kampaně, ne až po zamítnutí.
- **V samotné reklamě se nesmí slibovat konkrétní sazba ani schválení hypotéky.**
- **Rychlost reakce na lead rozhoduje víc než cokoli na webu.** Web slibuje odpověď do 24 hodin (v pracovní dny do hodiny) — tohle je potřeba reálně dodržet, jinak konverze leadů na schůzky výrazně klesá.

## 7. Seznam všech `TODO:` míst, která musí doplnit klient

V kódu jsou vyznačená přímo textem `TODO:`, najdete je i takto:

```bash
grep -rn "TODO:" index.html gdpr.html
```

Konkrétně:

- **Patička webu (`index.html`)** — obchodní firma/IČO/sídlo Jana Frýdla, přesný vztah k 4fin (vázaný zástupce / samostatný zprostředkovatel + IČO 4fin), číslo v registru ČNB.
- **`gdpr.html`** — přesný právní vztah k 4fin (případně společný správce), doba uchování údajů, konkrétní názvy zpracovatelů (hosting, CRM, e-mail).
- **OG obrázek** (`public/img/og-image.jpg`) — vygenerovaný automaticky z portrétní fotky na značkovém pozadí, funkční, ale bez textového titulku. Grafik ho může doplnit o nadpis pro lepší vzhled při sdílení na sociálních sítích.

## 8. Poznámka k designu

Barvy, písmo (Montserrat Variable) a tvarosloví tlačítek jsou převzaté přímo ze skutečného webu janfrydl.cz, aby reklama → landing page → hlavní web působily jako od jednoho člověka. Funkční barvy (úspěch/upozornění/focus) a zlatý akcent na čísle splátky a odemčeném srovnání jsou navíc — jsou odvozené ze stejné barevné "teploty" jako hlavní značková barva.

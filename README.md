# Hi Amsterdam

Website for Kapsalon Hi Amsterdam. Next.js 16 (App Router, Turbopack), React 19,
Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com).

## Editing the content

Every price, opening time, address and photo on the site lives in
**[`content.yml`](content.yml)** in the project root — one file, annotated in
Dutch, meant to be edited by the salon owner rather than by a developer:

| What                              | Key in content.yml |
| --------------------------------- | ------------------ |
| Name, description (page titles)    | `salon`            |
| Address, phone, email              | `contact`          |
| Opening and closing times, per day | `openingstijden`   |
| Services and prices                | `tarieven`         |
| Booking form's service dropdown    | `behandelingen`    |
| Photos on the home page            | `fotos`            |

Push a change to `main` and GitHub Actions puts it online a few minutes later —
see [Preview on GitHub Pages](#preview-on-github-pages). New photos go in
`public/`; `content.yml` only holds the file name.

Opening hours are written per day. Consecutive days that share their hours are
collapsed into one row ("Maandag t/m vrijdag") at render time, so changing a
single Wednesday splits the row by itself. The booking form derives its list of
times from these hours too.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

`dev`, `build` and `lint` each run `scripts/generate-content.mjs` first, which
turns `content.yml` into `src/lib/content.generated.ts`. That generated file is
gitignored and must never be edited by hand.

The generator is also the validator: a time that isn't a time, a photo missing
from `public/`, a phone number a handset can't dial — each fails the build with
a plain-language message instead of a broken page.

To edit `content.yml` while the dev server is running, start a watcher in a
second terminal:

```bash
npm run content:watch
```

## Preview on GitHub Pages

`.github/workflows/preview.yml` builds the site on every push to `main` and
publishes it to GitHub Pages. One-time setup: **Settings → Pages → Source:
GitHub Actions**.

The preview is a static export (`output: "export"`), which has one consequence
worth knowing: GitHub Pages serves files only, so it cannot run the booking
form's Server Action. On the preview the form validates against exactly the same
rules and shows the same confirmation, but the request goes nowhere — see
`src/app/maak-een-afspraak/actions.static.ts`, which `next.config.ts` swaps in
for that build.

So the preview is for looking at the site. A deployment that also takes bookings
needs a host that runs Node (Vercel, Netlify, your own server), where the real
Server Action is used.

## Project structure

```
content.yml               all content — the only file the owner touches
scripts/
  generate-content.mjs    content.yml → src/lib/content.generated.ts
src/
  app/
    layout.tsx            root layout: fonts, metadata, <html>/<body>
    page.tsx              home page
    over-ons/             about, map, reviews
    maak-een-afspraak/    booking form + Server Action
    globals.css           Tailwind entry + shadcn theme tokens
  components/ui/          shadcn/ui primitives — generated, edit with care
  lib/
    site.ts               derives what the pages render from the content
    reservation.ts        booking validation, shared server and client
    utils.ts              cn() helper
```

## Environment variables

See `.env.example`. Both are optional: without a key the reviews section falls
back to a link to Google, and the map on `/over-ons` needs no key at all.

## shadcn/ui

Initialised with the `radix` base and the `nova` preset (see `components.json`),
neutral base colour. Installed primitives: accordion, avatar, badge, button,
card, carousel, dialog, field, input, label, navigation-menu, select, separator,
sheet, sonner, tabs, textarea.

Add more with:

```bash
npx shadcn@latest add <component>
```

Note: this shadcn version replaces the old `form` component with `field`, which
works with plain React state or with react-hook-form.

## Theming

Design tokens are CSS variables in `src/app/globals.css` — the stock shadcn
neutral palette with a `.dark` variant. The site is pinned to dark in
`layout.tsx`.

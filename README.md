# runwithbao.app

The Bao Run website: a landing page, privacy policy, terms, account deletion and contact. Static Astro; screenshots
are compressed to WebP.

Bao comes from the app's own animation, `public/bao.json` (generated in the app repo by
`scripts/mascot/bao_lottie.py`). Every Bao on a page is a still SVG pose exported from it; the bigger ones marked
`live` also play his loop with lottie-web once they're on screen (not with reduced motion). After copying in a new
`bao.json`, run `node scripts/bao-poses.mjs` (needs a Chrome or Chromium) to refresh `src/illustrations/bao-poses.json`.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # regenerate share artwork and build the static site in dist/
```

It's hosted on Cloudflare Pages, project `runwithbao-site`. Deploy with Node 22.23.4 or later:

```sh
npm run build
npx wrangler@4 pages deploy dist --project-name runwithbao-site --branch main
```

Screenshots in `src/assets/screens/` are real app screens at 640×916 (the phone's status bar cropped off).
`npm run build` generates the 1200×630 share card in `src/assets/share/bao.png` and `public/og.png` from Bao's
shapes and licensed Fraunces and Archivo fonts in `scripts/fonts/`. `public/favicon.svg` is also drawn from Bao's shapes.

Before taking payments, add a postal address to the contact page and the privacy policy's "Who we are".

# runwithbao.app

The Bao Run website: a landing page, privacy policy, terms, account deletion and contact. Static Astro, with no
client-side JavaScript; Bao is drawn at build time and screenshots are compressed to WebP.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Deploy `dist/` to any static host (Cloudflare Pages, Netlify, GitHub Pages): build command `npm run build`,
output directory `dist`.

Screenshots in `src/assets/screens/` are real app screens at 640×916 (the phone's status bar cropped off).
`public/og.png` and `public/favicon.svg` are drawn from Bao's shapes.

Before taking payments, add a postal address to the contact page and the privacy policy's "Who we are".

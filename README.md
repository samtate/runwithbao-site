# runwithbao.app

The Bao Run website: a landing page, privacy policy, terms, account deletion and contact. Static Astro, with no
client-side JavaScript; Bao is drawn at build time and screenshots are compressed to WebP.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

It's hosted on Cloudflare Pages, project `runwithbao-site`. Deploy with Node 22.23.4 or later:

```sh
npm run build
npx wrangler@4 pages deploy dist --project-name runwithbao-site --branch main
```

Screenshots in `src/assets/screens/` are real app screens at 640×916 (the phone's status bar cropped off).
`public/og.png` and `public/favicon.svg` are drawn from Bao's shapes.

Before taking payments, add a postal address to the contact page and the privacy policy's "Who we are".

// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// A static site: every page is plain HTML and CSS, with no JavaScript unless a page asks for it.
export default defineConfig({
  site: "https://runwithbao.app",
  compressHTML: true,
  build: { inlineStylesheets: "auto" },
  // Articles are MDX so they can show diagrams drawn as components, still with no JavaScript.
  integrations: [mdx()],
});

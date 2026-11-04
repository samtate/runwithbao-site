// @ts-check
import { defineConfig } from "astro/config";

// A static site: every page is plain HTML and CSS, with no JavaScript unless a page asks for it.
export default defineConfig({
  site: "https://runwithbao.app",
  compressHTML: true,
  build: { inlineStylesheets: "auto" },
});

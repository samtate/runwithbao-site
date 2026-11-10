import type { APIRoute } from "astro";
import { SITE } from "../site";

/** Every public page, for search engines. Articles are found from their Markdown files. */
export const GET: APIRoute = () => {
  const fixed = ["/", "/pricing", "/articles", "/privacy", "/terms", "/contact", "/delete-account"];
  const articles = Object.keys(import.meta.glob("./articles/*.mdx")).map((p) => `/articles/${p.slice(11, -4)}`);
  const urls = [...fixed, ...articles].map((path) => `  <url><loc>${SITE}${path}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } });
};

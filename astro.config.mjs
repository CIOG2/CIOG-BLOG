import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

const site = "https://ciog.dev";

const pagesPriority = [
  { url: '/', priority: 1 },
  { url: '/sobre-mi/', priority: 0.9 },
  { url: '/blog/', priority: 0.8 },
];

const getPagePriority = (url) => {
  const page = pagesPriority.find((page) => `${site}${page.url}` === url);
  return page ? page.priority : 0.7;
};

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      serialize(item) {
        item.priority = getPagePriority(item.url);
        item.lastmod = new Date();
        item.changefreq = "weekly"; // Default changefreq
        return item;
      },
    }),
  ],
  site: site,
});
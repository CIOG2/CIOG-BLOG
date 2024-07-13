import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

// https://astro.build/config

const baseUrl = process.env.NODE_ENV === 'production' ? process.env.BASE_URL : '/';

export default defineConfig({
  integrations: [tailwind(), mdx()],
  site: "https://ciog.dev/",
  base: baseUrl,
});

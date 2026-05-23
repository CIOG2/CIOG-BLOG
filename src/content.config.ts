import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
    schema: ({image}) => z.object({
        title: z.string(),
        intro: z.string(),
        tag: z.string(),
        image: image().optional(),
        author: reference('author'),
        pubDate: z.date(),
        type: z.string().optional(),
        keywords: z.string().optional(),
        authorSEO: z.string().optional(),
    }),
});

const pageCollection = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/page" }),
    schema: ({image}) => z.object({
        title: z.string(),
        intro: z.string(),
        author: reference('author'),
        image: image().optional(),
        type: z.string().optional(),
        keywords: z.string().optional(),
        authorSEO: z.string().optional(),
    }),
});

const authorCollection = defineCollection({
    loader: glob({ pattern: "**/*.{json,yaml,yml}", base: "./src/content/author" }),
    schema: ({image}) => z.object({
        displayName: z.string(),
        bio: z.string().optional(),
        photo: image().optional()
    }),
});

const frasesCollection = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/frases" }),
    schema: ({image}) => z.object({
        title: z.string(),
        intro: z.string(),
        tag: z.string(),
        image: image().optional(),
        author: reference('author'),
        pubDate: z.date(),
        type: z.string().optional(),
        keywords: z.string().optional(),
        authorSEO: z.string().optional(),
    }),
});

export const collections = {
    'blog': blogCollection,
    'author': authorCollection,
    'page': pageCollection,
    'frases': frasesCollection,
};

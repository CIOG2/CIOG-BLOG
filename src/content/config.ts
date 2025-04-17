import { defineCollection, reference, z } from 'astro:content';
import { boolean } from 'astro:schema';

const blogCollection = defineCollection({
    type: 'content', // v2.5.0 and later
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
    type: 'content', // v2.5.0 and later
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
    type: 'data', // v2.5.0 and later
    schema: ({image}) => z.object({
        displayName: z.string(),
        bio: z.string().optional(),
        photo: image().optional()
    }),
});

const frasesCollection = defineCollection({
    type: 'content', // v2.5.0 and later
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
        haveMusic: z.boolean(),
    }),
});




export const collections = {
    'blog': blogCollection,
    'author': authorCollection,
    'page': pageCollection,
    'frases': frasesCollection,
};
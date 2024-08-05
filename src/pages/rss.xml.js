import rss from '@astrojs/rss';
import config from '../config.mjs';
import { getCollection } from 'astro:content';

export async function get(context) {
    const blog = await getCollection('blog');
    return rss({
        title: config.title + config.titleSuffix,
        description: config.description,
        site: config.url,
        items: blog.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.intro,
            keywords: post.data.keywords,
            authorSEO: post.data.authorSEO,
            link: `/blog/${post.slug}/`,
        })),
        customData: `<language>es-mx</language>`,
    });
}
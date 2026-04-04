import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

const BASE_URL = 'https://agentdoom.ai';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/feed`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/creators`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/featured`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/launch`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  let toolPages: MetadataRoute.Sitemap = [];
  let creatorPages: MetadataRoute.Sitemap = [];

  try {
    const sql = getDb();

    const tools = (await sql`
      SELECT slug, updated_at FROM tools
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT 5000
    `) as { slug: string; updated_at: string }[];

    toolPages = tools.map((tool) => ({
      url: `${BASE_URL}/t/${tool.slug}`,
      lastModified: new Date(tool.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const creators = (await sql`
      SELECT username, updated_at FROM users
      WHERE tools_created > 0
      ORDER BY updated_at DESC
      LIMIT 5000
    `) as { username: string; updated_at: string }[];

    creatorPages = creators.map((creator) => ({
      url: `${BASE_URL}/u/${creator.username}`,
      lastModified: new Date(creator.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch {
    // If DB is unavailable, return static pages only
  }

  return [...staticPages, ...toolPages, ...creatorPages];
}

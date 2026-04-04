import { readFileSync } from 'fs';
import { join } from 'path';
import { assembleTool } from '@/lib/forge/assemble';
import type { ToolConfig } from '@/lib/forge/generate';
import type { FeedResponse, FeedTool } from '@/lib/feed/types';

interface SeedIndexEntry {
  file: string;
  category: string;
}

interface SeedIndex {
  tools: SeedIndexEntry[];
}

interface SeedToolConfig extends ToolConfig {
  category?: string;
}

interface SeedLookupResult {
  slug: string;
  title: string;
  description: string;
  category: string;
  config: ToolConfig;
  previewHtml: string;
}

const DATA_DIR = join(process.cwd(), 'data', 'seed-tools');
const CATEGORY_MAP: Record<string, string> = {
  health: 'productivity',
  fun: 'social',
  utilities: 'utility',
};

let seedBySlug: Map<string, SeedLookupResult> | null = null;

function normalizeCategory(category: string): string {
  return CATEGORY_MAP[category] ?? category;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function loadSeedIndex(): Map<string, SeedLookupResult> {
  const indexPath = join(DATA_DIR, 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as SeedIndex;
  const map = new Map<string, SeedLookupResult>();

  for (const entry of index.tools) {
    const toolPath = join(DATA_DIR, entry.file);
    const config = JSON.parse(readFileSync(toolPath, 'utf-8')) as SeedToolConfig;
    const category = normalizeCategory(config.category || entry.category);
    const slug = generateSlug(config.title);
    const previewHtml = assembleTool(config);

    map.set(slug, {
      slug,
      title: config.title,
      description: config.description ?? '',
      category,
      config,
      previewHtml,
    });
  }

  return map;
}

function getSeedMap(): Map<string, SeedLookupResult> {
  if (!seedBySlug) {
    seedBySlug = loadSeedIndex();
  }
  return seedBySlug;
}

function toFeedTool(seed: SeedLookupResult): FeedTool {
  return {
    id: `seed:${seed.slug}`,
    slug: seed.slug,
    title: seed.title,
    description: seed.description,
    prompt: `Seed tool: ${seed.title}`,
    category: seed.category,
    creator: {
      id: 'seed-creator',
      username: 'agentdoom',
      displayName: 'AgentDoom',
      avatarUrl: null,
      isVerified: true,
    },
    deployUrl: null,
    thumbnailUrl: null,
    previewHtml: seed.previewHtml,
    isPaid: false,
    priceCents: 0,
    viewsCount: 0,
    usesCount: 0,
    remixesCount: 0,
    sharesCount: 0,
    likesCount: 0,
    remixedFrom: null,
    remixedFromSlug: null,
    remixedFromTitle: null,
    createdAt: new Date().toISOString(),
  };
}

export function getSeedToolBySlug(slug: string): SeedLookupResult | null {
  return getSeedMap().get(slug) ?? null;
}

export function getSeedToolBySlugOrId(identifier: string): SeedLookupResult | null {
  if (identifier.startsWith('seed:')) {
    return getSeedToolBySlug(identifier.slice(5));
  }
  return getSeedToolBySlug(identifier);
}

export function getSeedFeedResponse(category?: string, limit: number = 20): FeedResponse {
  const allTools = Array.from(getSeedMap().values())
    .filter((tool) => (category ? tool.category === category : true))
    .slice(0, limit)
    .map(toFeedTool);

  return {
    sections: [
      {
        type: 'chronological',
        title: 'Seed Tools',
        tools: allTools,
      },
    ],
    cursor: null,
  };
}

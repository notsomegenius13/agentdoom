/** Feed & Discovery types for AgentDoom */

export interface FeedTool {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prompt: string;
  category: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    isPro?: boolean;
  };
  deployUrl: string | null;
  thumbnailUrl: string | null;
  previewHtml: string | null;
  isPaid: boolean;
  priceCents: number;
  viewsCount: number;
  usesCount: number;
  remixesCount: number;
  sharesCount: number;
  likesCount: number;
  remixedFrom: string | null;
  remixedFromSlug: string | null;
  remixedFromTitle: string | null;
  createdAt: string;
}

export interface FeedSection {
  type: 'featured' | 'curated' | 'trending' | 'just_shipped' | 'chronological' | 'category';
  title: string;
  tools: FeedTool[];
}

export interface FeaturedTool {
  tool: FeedTool;
  featuredDate: string;
  reason: string | null;
  selectedBy: 'auto' | 'admin';
}

export interface FeedResponse {
  sections: FeedSection[];
  cursor: string | null;
}

export type FeedSort = 'trending' | 'new' | 'popular';

export interface FeedQuery {
  category?: string;
  creator?: string;
  cursor?: string;
  limit?: number;
  search?: string;
  sort?: FeedSort;
}

export interface SearchResult {
  tools: FeedTool[];
  total: number;
  cursor: string | null;
}

export type EventType =
  | 'view'
  | 'use'
  | 'remix'
  | 'share'
  | 'like'
  | 'unlike'
  | 'purchase'
  | 'deploy';

export interface RankingWeights {
  freshness: number;
  engagement: number;
  creator: number;
  trending: number;
}

/** V1 default weights — tuned for launch (favor freshness + curation) */
export const V1_WEIGHTS: RankingWeights = {
  freshness: 0.4,
  engagement: 0.25,
  creator: 0.1,
  trending: 0.25,
};

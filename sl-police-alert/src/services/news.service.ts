import type { HiruNews } from '@/types';

const HIRU_NEWS_URL =
  'https://hirunews.lk/api/fetch_news.php?page=1&category=General';
const HIRU_IMAGE_BASE = 'https://cdn.hirunews.lk/Data/News_Images/';

type HiruNewsDTO = {
  sinhala_title?: string;
  sinhala_story?: string;
  sinhala_added_date?: string;
  sinhala_art_id?: string;
  sin_image?: string;
  seourltitle?: string;
};

export class NewsService {
  private cache: HiruNews[] | null = null;

  async getLatest(limit = 8, fresh = false): Promise<HiruNews[]> {
    if (!fresh && this.cache) return this.cache.slice(0, limit);

    const res = await fetch(HIRU_NEWS_URL);
    if (!res.ok) {
      throw new Error('Failed to load Hiru News');
    }

    const payload: unknown = await res.json();
    if (!Array.isArray(payload)) return [];

    this.cache = payload
      .map(toHiruNews)
      .filter(news => news.title && news.id);
    return this.cache.slice(0, limit);
  }
}

function toHiruNews(raw: HiruNewsDTO): HiruNews {
  return {
    id: String(raw.sinhala_art_id ?? ''),
    title: raw.sinhala_title ?? '',
    story: raw.sinhala_story ?? '',
    date: raw.sinhala_added_date ?? '',
    image: raw.sin_image ? `${HIRU_IMAGE_BASE}${raw.sin_image}` : '',
    url: raw.seourltitle ? `https://hirunews.lk/${raw.seourltitle}` : '',
  };
}
import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface Announcement {
  id: number;
  title: string;
  title_plain: string;
  show_modal: boolean;
  link_url: string | null;
  link_text: string | null;
  /** Only present on detail responses. */
  body?: string;
  /** Only present on detail responses. */
  image_url?: string | null;
  /** Only present on detail responses. */
  image_display_mode?: string;
  /** Only present on detail responses. */
  image_overlay_opacity?: number;
  [key: string]: unknown;
}

/** Announcements API: retrieve active store announcements. */
export class AnnouncementsModule {
  constructor(private http: HttpClient) {}

  /** Get all currently active announcements. */
  async getActive(opts?: RequestOptions): Promise<Announcement[]> {
    const data = await this.http.get<{ announcements: Announcement[] }>('/api/announcements/active/', undefined, opts);
    return data.announcements;
  }

  /** Get a single announcement by ID. */
  async get(id: number, opts?: RequestOptions): Promise<Announcement> {
    return this.http.get(`/api/announcements/${id}/detail/`, undefined, opts);
  }
}

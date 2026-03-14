import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface ContactFormInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  message_type?: 'general' | 'support' | 'order' | 'product' | 'other';
  order_number?: string;
  [key: string]: unknown;
}

export interface ContactSubject {
  value: string;
  label: string;
  [key: string]: unknown;
}

export interface Message {
  id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** Messages API: contact forms and authenticated message viewing. */
export class MessagesModule {
  constructor(private http: HttpClient) {}

  /** Submit a public contact form. */
  async submitContactForm(data: ContactFormInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/messages/contact/', data, opts);
  }

  /** Get available contact form subjects. */
  async getContactSubjects(opts?: RequestOptions): Promise<ContactSubject[]> {
    return this.http.get('/api/messages/contact/subjects/', undefined, opts);
  }

  /** List the authenticated user's messages. Requires authentication. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Message>> {
    return this.http.get('/api/messages/', params as Record<string, unknown>, opts);
  }

  /** Get a single message by ID. Requires authentication. */
  async get(id: number, opts?: RequestOptions): Promise<Message> {
    return this.http.get(`/api/messages/${id}/`, undefined, opts);
  }
}

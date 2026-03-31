import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Unified message summary (list view) — combines contact forms and order notes. */
export interface AdminMessage {
  id: number;
  source: 'contact_form' | 'order_note';
  name: string;
  email: string;
  subject: string;
  preview: string;
  status: string;
  status_display: string;
  created_at: string;
  /** Number of replies in this thread. */
  reply_count: number;
  /** Timestamp of the most recent reply (null if no replies). */
  last_reply_at: string | null;
  /** Deep-link: contact form message ID (null for order notes). */
  message_id: number | null;
  /** Deep-link: associated order ID (null if no order). */
  order_id: number | null;
  /** Deep-link: associated order number (null if no order). */
  order_number: string | null;
  [key: string]: unknown;
}

/** Individual reply in a message thread. */
export interface AdminMessageReply {
  id: number;
  /** Who sent this reply: 'customer' or 'staff'. */
  sender_type: 'customer' | 'staff';
  /** Display name of the sender. */
  sender_name: string;
  /** Reply content. */
  content: string;
  /** Whether this reply was emailed to the customer (staff replies only). */
  email_sent: boolean;
  created_at: string;
}

/** Unified message detail (single view). */
export interface AdminMessageDetail {
  id: number;
  source: 'contact_form' | 'order_note';
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  message_type: string;
  type_display: string;
  status: string;
  status_display: string;
  read_at: string | null;
  read_by_name: string | null;
  created_at: string;
  updated_at: string;
  /** Latest staff reply text (backward compat). */
  reply_text: string | null;
  /** When the latest staff reply was sent. */
  replied_at: string | null;
  /** Name of staff member who last replied. */
  replied_by_name: string | null;
  /** Full conversation thread, chronologically ordered. */
  replies: AdminMessageReply[];
  /** Number of replies in this thread. */
  reply_count: number;
  message_id: number | null;
  order_id: number | null;
  order_number: string | null;
  [key: string]: unknown;
}

export interface MessageCounts {
  total: number;
  unread: number;
  contact_form: number;
  order_note: number;
  [key: string]: unknown;
}

export interface UnreadCount {
  count: number;
  [key: string]: unknown;
}

export interface MessageStatusUpdateInput {
  is_read: boolean;
}

export interface MessageReplyInput {
  message: string;
  notify_customer?: boolean;
}

export interface AdminMessageListParams {
  source?: 'contact_form' | 'order_note';
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/** Message list response with custom admin pagination. */
export interface MessageListResponse {
  messages: AdminMessage[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin message management: unified inbox for contact forms and order notes. */
export class AdminMessagesModule {
  constructor(private http: HttpClient) {}

  /** List messages with filtering and pagination. */
  async list(params?: AdminMessageListParams, opts?: RequestOptions): Promise<MessageListResponse> {
    return this.http.get('/api/admin/messages/', params as Record<string, unknown>, opts);
  }

  /** Get message count statistics. */
  async getCounts(opts?: RequestOptions): Promise<MessageCounts> {
    return this.http.get('/api/admin/messages/counts/', undefined, opts);
  }

  /** Get unread message count. */
  async getUnreadCount(opts?: RequestOptions): Promise<UnreadCount> {
    return this.http.get('/api/admin/messages/unread-count/', undefined, opts);
  }

  /** Get message detail. */
  async get(source: 'contact_form' | 'order_note', messageId: number, opts?: RequestOptions): Promise<AdminMessageDetail> {
    return this.http.get(`/api/admin/messages/${source}/${messageId}/`, undefined, opts);
  }

  /** Update message read status. */
  async updateStatus(source: 'contact_form' | 'order_note', messageId: number, data: MessageStatusUpdateInput, opts?: RequestOptions): Promise<AdminMessageDetail> {
    return this.http.put(`/api/admin/messages/${source}/${messageId}/status/`, data, opts);
  }

  /** Reply to a contact form message. */
  async reply(messageId: number, data: MessageReplyInput, opts?: RequestOptions): Promise<unknown> {
    return this.http.post(`/api/admin/messages/contact_form/${messageId}/reply/`, data, opts);
  }
}

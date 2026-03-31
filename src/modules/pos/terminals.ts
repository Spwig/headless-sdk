import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** POS terminal registration input. */
export interface TerminalRegisterInput {
  name: string;
  device_id: string;
  device_type?: string;
  location?: string;
}

/** POS terminal configuration. */
export interface TerminalConfig {
  terminal_id: number;
  terminal_name: string;
  store_name: string;
  currency: string;
  tax_inclusive: boolean;
  receipt_template: string;
  idle_timeout: number;
  require_manager_discount: boolean;
  max_discount_percent: number;
  [key: string]: unknown;
}

/** POS manager/staff member. */
export interface PosManager {
  id: number;
  name: string;
  email: string;
  role: string;
}

/** Receipt template data. */
export interface ReceiptTemplate {
  header: string;
  footer: string;
  logo_url: string | null;
  [key: string]: unknown;
}

/** Promotional slide for idle display. */
export interface PromoSlide {
  id: number;
  image_url: string;
  title: string;
  description: string;
  order: number;
  [key: string]: unknown;
}

/** Staff card registration input. */
export interface StaffCardInput {
  staff_id: number;
  card_id: string;
}

/** POS Terminal management: registration, config, heartbeat, security. */
export class PosTerminalsModule {
  constructor(private http: HttpClient) {}

  /** Register a new POS terminal. */
  async register(data: TerminalRegisterInput, opts?: RequestOptions): Promise<{ terminal_id: number; pairing_code: string }> {
    return this.http.post('/api/pos/terminals/register/', data, opts);
  }

  /** Get terminal configuration. */
  async getConfig(opts?: RequestOptions): Promise<TerminalConfig> {
    return this.http.get('/api/pos/terminals/config/', undefined, opts);
  }

  /** Send heartbeat to keep terminal active. */
  async heartbeat(opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/terminals/heartbeat/', undefined, opts);
  }

  /** Display a pairing code on the terminal screen. */
  async displayPairing(opts?: RequestOptions): Promise<{ pairing_code: string; expires_at: string }> {
    return this.http.post('/api/pos/terminals/display-pairing/', undefined, opts);
  }

  /** List managers for the current terminal's location. */
  async getManagers(opts?: RequestOptions): Promise<PosManager[]> {
    return this.http.get('/api/pos/terminals/managers/', undefined, opts);
  }

  /** Verify a manager's unlock PIN. */
  async verifyUnlockPin(pin: string, opts?: RequestOptions): Promise<{ valid: boolean; staff_id?: number }> {
    return this.http.post('/api/pos/terminals/unlock/', { pin }, opts);
  }

  /** Log a terminal lock event. */
  async logLockEvent(opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/terminals/lock-event/', undefined, opts);
  }

  /** Verify an NFC/RFID unlock card. */
  async verifyUnlockCard(cardId: string, opts?: RequestOptions): Promise<{ valid: boolean; staff_id?: number }> {
    return this.http.post('/api/pos/terminals/unlock-card/', { card_id: cardId }, opts);
  }

  /** Register an NFC/RFID card for a staff member. */
  async registerStaffCard(data: StaffCardInput, opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/staff/register-card/', data, opts);
  }

  /** Remove a staff member's NFC/RFID card. */
  async removeStaffCard(data: StaffCardInput, opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/staff/remove-card/', data, opts);
  }

  /** Set a staff member's PIN. */
  async setStaffPin(staffId: number, pin: string, opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/staff/set-pin/', { staff_id: staffId, pin }, opts);
  }

  /** Get receipt template for the terminal. */
  async getReceiptTemplate(opts?: RequestOptions): Promise<ReceiptTemplate> {
    return this.http.get('/api/pos/receipt-template/', undefined, opts);
  }

  /** Get promotional slides for idle display. */
  async getPromoSlides(opts?: RequestOptions): Promise<PromoSlide[]> {
    return this.http.get('/api/pos/promo-slides/', undefined, opts);
  }
}

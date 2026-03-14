import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface FormField {
  id: number;
  field_name: string;
  field_type: string;
  label: string;
  placeholder: string;
  help_text: string;
  is_required: boolean;
  width: string;
  order: number;
  default_value: string;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  pattern_message?: string;
  options?: unknown;
  step?: { id: number; title: string; order: number };
  [key: string]: unknown;
}

export interface FormStep {
  id: number;
  title: string;
  description: string;
  order: number;
  is_skippable: boolean;
  next_button_text: string;
  back_button_text: string;
}

export interface Form {
  id: number;
  slug: string;
  title: string;
  description: string;
  submit_button_text: string;
  success_message: string;
  error_message: string;
  is_multi_step: boolean;
  require_login: boolean;
  spam_protection: string;
  save_partial_responses: boolean;
  steps: FormStep[];
  fields: FormField[];
  rules: unknown[];
  [key: string]: unknown;
}

export interface FormSubmission {
  success: boolean;
  message: string;
  response_id: number;
}

/** Forms API: retrieve forms, submit entries, save partial progress, and upload files. */
export class FormsModule {
  constructor(private http: HttpClient) {}

  /** Get a form by its slug. */
  async get(slug: string, opts?: RequestOptions): Promise<Form> {
    return this.http.get(`/api/form-builder/forms/${slug}/`, undefined, opts);
  }

  /** Submit a completed form. */
  async submit(slug: string, data: Record<string, unknown>, opts?: RequestOptions): Promise<FormSubmission> {
    return this.http.post(`/api/form-builder/forms/${slug}/submit/`, data, opts);
  }

  /** Save partial form progress. */
  async savePartial(slug: string, data: Record<string, unknown>, opts?: RequestOptions): Promise<{ success: boolean; response_id: number; current_step: number }> {
    return this.http.post(`/api/form-builder/forms/${slug}/partial/`, data, opts);
  }

  /** Upload a file for a form field. */
  async uploadFile(slug: string, file: File, fieldName: string = 'file', opts?: RequestOptions): Promise<{ success: boolean; file_path: string; file_name: string; file_size: number }> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.http.post(`/api/form-builder/forms/${slug}/upload/`, formData, opts);
  }
}

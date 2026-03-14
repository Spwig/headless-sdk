import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface CustomizerSurface {
  id: number;
  name: string;
  slug: string;
  mockup_url: string | null;
  dimension_unit: string;
  width: string;
  height: string;
  area_x_percent: string;
  area_y_percent: string;
  area_width_percent: string;
  area_height_percent: string;
  min_dpi: number;
  recommended_dpi: number;
  background_color: string;
  allow_text: boolean;
  allow_image_upload: boolean;
  allow_clipart: boolean;
  max_elements: number;
  [key: string]: unknown;
}

export interface CustomizerConfig {
  product_id: number;
  product_name: string;
  editor_mode: string;
  allow_image_upload: boolean;
  allow_text: boolean;
  allow_clipart: boolean;
  max_uploads_per_surface: number;
  max_upload_size_mb: string;
  allowed_upload_types: string[];
  surfaces: CustomizerSurface[];
  clipart_categories: { id: number; name: string; slug: string; icon: string; asset_count: number }[];
  fonts: FontInfo[];
  templates: DesignTemplate[];
  pricing: {
    base_design_fee: string;
    per_surface_fee: string;
    per_upload_fee: string;
    per_text_fee: string;
    currency: string;
  };
  [key: string]: unknown;
}

export interface ClipartItem {
  id: number;
  name: string;
  category: string;
  category_slug: string;
  url: string;
  tags: string[];
  [key: string]: unknown;
}

export interface FontInfo {
  id: number;
  name: string;
  family: string;
  is_system_font: boolean;
  regular_url?: string;
  bold_url?: string;
  italic_url?: string;
  bold_italic_url?: string;
  [key: string]: unknown;
}

export interface DesignTemplate {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnail_url: string | null;
  design_data: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SavedDesign {
  id: number;
  name: string;
  product_id: number;
  product_name: string;
  thumbnails: Record<string, unknown>;
  design_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface SaveDesignInput {
  name: string;
  product_id: number;
  design_data: Record<string, unknown>;
  preview_image?: string;
}

export interface PriceCalculation {
  pricing: Record<string, unknown>;
  [key: string]: unknown;
}

/** Customizer API: product customization, design management, and pricing. */
export class CustomizerModule {
  constructor(private http: HttpClient) {}

  /** Get customization configuration for a product. */
  async getConfig(productId: number, opts?: RequestOptions): Promise<CustomizerConfig> {
    return this.http.get(`/api/customizable-product/${productId}/config/`, undefined, opts);
  }

  /** Upload an image for use in the customizer. */
  async uploadImage(file: File, opts?: RequestOptions): Promise<{ url: string; thumbnail: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post('/api/customizable-product/upload-image/', formData, opts);
  }

  /** List available clipart items. */
  async getClipart(opts?: RequestOptions): Promise<{ assets: ClipartItem[] }> {
    return this.http.get('/api/customizable-product/clipart/', undefined, opts);
  }

  /** Get available fonts for the customizer. */
  async getFonts(opts?: RequestOptions): Promise<FontInfo[]> {
    return this.http.get('/api/customizable-product/fonts/', undefined, opts);
  }

  /** Get design templates for a product. */
  async getTemplates(productId: number, opts?: RequestOptions): Promise<DesignTemplate[]> {
    return this.http.get(`/api/customizable-product/templates/${productId}/`, undefined, opts);
  }

  /** List the current customer's saved designs. Requires authentication. */
  async listDesigns(opts?: RequestOptions): Promise<{ designs: SavedDesign[] }> {
    return this.http.get('/api/customizable-product/designs/', undefined, opts);
  }

  /** Save a design. Requires authentication. */
  async saveDesign(data: SaveDesignInput, opts?: RequestOptions): Promise<SavedDesign> {
    return this.http.post('/api/customizable-product/designs/save/', data, opts);
  }

  /** Get a saved design by ID. Requires authentication. */
  async getDesign(id: number, opts?: RequestOptions): Promise<SavedDesign> {
    return this.http.get(`/api/customizable-product/designs/${id}/`, undefined, opts);
  }

  /** Delete a saved design. Requires authentication. */
  async deleteDesign(id: number, opts?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/customizable-product/designs/${id}/delete/`, opts);
  }

  /** Calculate the price for a customized product. */
  async calculatePrice(data: Record<string, unknown>, opts?: RequestOptions): Promise<PriceCalculation> {
    return this.http.post('/api/customizable-product/calculate-price/', data, opts);
  }

  /** Prepare a customized product for adding to cart. */
  async prepareForCart(data: Record<string, unknown>, opts?: RequestOptions): Promise<{ success: boolean; design_token: string; pricing: Record<string, unknown> }> {
    return this.http.post('/api/customizable-product/prepare-for-cart/', data, opts);
  }
}

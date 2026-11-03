import {
  Product,
  ProductCategory,
  Order,
  Customer,
  Donation,
  ContentItem,
  ContactMessage,
  FaqItem,
  ActivityItem,
  PressItem,
  PartnerItem,
  CategoryItem,
  ParcoursItem,
  PaymentRecord,
  DashboardUser,
  SettingsState,
  OverviewMetrics,
  PaymentStatus,
  ShippingStatus,
  PermissionItem,
  PaginatedPermissionsResult,
  RoleItem,
  CreateRolePayload,
  UpdateRolePayload,
} from '@/types/dashboard';

import {
  initialProducts,
  initialOrders,
  initialCustomers,
  initialDonations,
  initialContents,
  initialContactMessages,
  initialFaqs,
  initialActivities,
  initialPressItems,
  initialPartners,
  initialCategories,
  initialParcours,
  initialPayments,
  initialUsers,
  initialSettings,
  overviewMetricsData,
} from '@/lib/mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

/**
 * Résout l'URL complète d'un média (ex. photo de profil stockée sur l'API NestJS).
 * Si le chemin est relatif (ex. /uploads/profiles/...), il est préfixé avec l'origine de l'API.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return '/default-avatar.svg';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

const LIVE_API_STORAGE_KEYS = new Set([
  'products',
  'product_categories',
  'faqs',
  'contact_messages',
  'press_items',
  'activities',
  'contents',
]);

// Helper to access localStorage safely on the client
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    if (LIVE_API_STORAGE_KEYS.has(key)) {
      window.localStorage.removeItem(`nb_admin_${key}`);
      return defaultValue;
    }
    const item = window.localStorage.getItem(`nb_admin_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    if (LIVE_API_STORAGE_KEYS.has(key)) {
      window.localStorage.removeItem(`nb_admin_${key}`);
      return;
    }
    window.localStorage.setItem(`nb_admin_${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn('Storage write failed', error);
  }
}

function mapApiFaqToItem(item: any): FaqItem {
  return {
    id: item.id,
    question: item.question || '',
    answer: item.reponse || item.answer || '',
    category: item.categorie || item.category || 'Général',
    status: (String(item.statut || item.status || 'ACTIVE').toLowerCase() === 'inactive'
      ? 'inactive'
      : 'active') as 'active' | 'inactive',
    createdAt: item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : item.createdAt,
    updatedAt: item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : item.updatedAt,
  };
}

function mapApiParcoursToItem(item: any): ParcoursItem {
  return {
    id: item.id,
    title: item.titre || item.title || '',
    description: item.description || '',
    period: item.annee || item.period || '',
    status: (String(item.statut || item.status || 'ACTIVE').toLowerCase() === 'inactive'
      ? 'inactive'
      : 'active') as 'active' | 'inactive',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : undefined,
  };
}

function mapApiPartnerToItem(item: any): PartnerItem {
  const rawLogo = item.logo || '';
  return {
    id: item.id,
    name: item.nom || item.name || '',
    logo: rawLogo ? getMediaUrl(rawLogo) : '',
    status: (String(item.statut || item.status || 'ACTIVE').toLowerCase() === 'inactive'
      ? 'inactive'
      : 'active') as 'active' | 'inactive',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : undefined,
  };
}

function mapApiPressToItem(item: any): PressItem {
  const rawImage = item.image || '';
  return {
    id: item.id,
    title: item.titre || item.title || '',
    description: item.description || '',
    link: item.lien || item.link || '',
    image: rawImage ? getMediaUrl(rawImage) : '',
    source: item.source || '',
    status: (String(item.statut || item.status || 'ACTIVE').toLowerCase() === 'inactive'
      ? 'inactive'
      : 'active') as 'active' | 'inactive',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : undefined,
  };
}

function mapApiCategoryToItem(item: any): CategoryItem {
  const rawImage = item.image || '';
  return {
    id: item.id,
    title: item.titre || item.title || '',
    description: item.description || '',
    image: rawImage ? getMediaUrl(rawImage) : '',
    status: (String(item.statut || item.status || 'ACTIVE').toLowerCase() === 'inactive'
      ? 'inactive'
      : 'active') as 'active' | 'inactive',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : undefined,
  };
}

function mapApiActivityToItem(item: any): ActivityItem {
  const rawImages: string[] = Array.isArray(item.images)
    ? item.images
        .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
        .filter(Boolean)
    : [];
  const rawCover = item.image || item.imageCouverture || rawImages[0] || '';
  const resolvedImages =
    rawImages.length > 0
      ? rawImages.map((u) => getMediaUrl(u))
      : rawCover
      ? [getMediaUrl(rawCover)]
      : [];

  return {
    id: item.id,
    title: item.titre || item.title || '',
    category: item.categorie || item.category || 'Ateliers Bambou',
    description: item.description || '',
    status: (String(item.statut || item.status || 'ACTIVE').toLowerCase() === 'inactive'
      ? 'inactive'
      : 'active') as 'active' | 'inactive',
    image: resolvedImages[0] || '',
    images: resolvedImages,
    date: item.date || '',
    location: item.lieu || item.location || '',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : undefined,
  };
}

function dataUrlToFile(dataUrl: string, index: number): File | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext =
    mime === 'image/png'
      ? 'png'
      : mime === 'image/webp'
      ? 'webp'
      : 'jpg';
  return new File([bytes], `activity-upload-${index}.${ext}`, { type: mime });
}

function dataUrlToVideoFile(dataUrl: string): File | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext =
    mime === 'video/webm'
      ? 'webm'
      : mime === 'video/ogg' || mime === 'application/ogg'
      ? 'ogg'
      : mime === 'video/quicktime' || mime === 'video/x-quicktime' || mime === 'video/mov'
      ? 'mov'
      : 'mp4';
  return new File([bytes], `content-video-${Date.now()}.${ext}`, { type: mime });
}

function mapApiContentToItem(item: any): ContentItem {
  const rawImages: string[] = Array.isArray(item.images)
    ? item.images
        .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
        .filter(Boolean)
    : [];
  const rawCover = item.image || item.imageCouverture || rawImages[0] || '';
  const resolvedImages =
    rawImages.length > 0
      ? rawImages.map((u) => getMediaUrl(u))
      : rawCover
      ? [getMediaUrl(rawCover)]
      : [];

  const rawVideo = item.video || '';
  const resolvedVideo = rawVideo
    ? rawVideo.startsWith('/uploads/')
      ? getMediaUrl(rawVideo)
      : rawVideo
    : '';

  const rawStatus = String(item.statut || item.status || 'DRAFT').toUpperCase();
  const status: 'published' | 'draft' =
    rawStatus === 'PUBLISHED' || rawStatus === 'ACTIVE'
      ? 'published'
      : 'draft';

  return {
    id: item.id,
    title: item.titre || item.title || '',
    slug:
      item.slug ||
      (item.titre || item.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    type: (item.format || item.type || 'article') as any,
    locale: (item.langue || item.locale || 'fr') as 'fr' | 'nl' | 'en',
    status,
    author: item.author || 'Équipe No Borders',
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : item.updated_at
      ? new Date(item.updated_at).toISOString().slice(0, 10)
      : item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    publishedAt: item.datePublication
      ? new Date(item.datePublication).toISOString().slice(0, 10)
      : item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : undefined,
    viewsCount:
      typeof item.views === 'number'
        ? item.views
        : typeof item.viewsCount === 'number'
        ? item.viewsCount
        : 0,
    image: resolvedImages[0] || '',
    images: resolvedImages,
    video: resolvedVideo,
    content: item.contenu ?? item.content ?? item.description ?? '',
  };
}

const MOTIF_LABELS: Record<string, string> = {
  demande_information: "Demande d'information",
  probleme_technique: 'Problème technique',
  signalement: 'Signalement',
  partenariat: 'Partenariat',
  autre: 'Autre',
};

function mapApiContactMessageToItem(item: any): ContactMessage {
  const nom = (item.nom || '').trim();
  const prenom = (item.prenom || '').trim();
  const fullName = prenom && nom
    ? `${prenom} ${nom}`
    : nom || prenom || item.name || 'Visiteur';

  const motifLabel = item.motif
    ? MOTIF_LABELS[item.motif] || item.motif
    : item.subject || 'Message de contact';

  const isUnread = item.isRead === false || item.status === 'unread';

  return {
    id: item.id,
    name: fullName,
    email: item.email || '',
    phone: item.phone || '',
    subject: motifLabel,
    message: item.message || '',
    status: isUnread ? 'unread' : 'read',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

function mapApiProductToItem(item: any): Product {
  const rawImages: string[] = Array.isArray(item.images)
    ? item.images
        .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
        .filter(Boolean)
    : [];
  const rawCover = item.image || item.imageCouverture || rawImages[0] || '';
  const resolvedImages =
    rawImages.length > 0
      ? rawImages.map((u: string) => getMediaUrl(u))
      : rawCover
      ? [getMediaUrl(rawCover)]
      : [];

  let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
  const rawStockStatus = String(
    item.stockStatus || item.status || '',
  ).toLowerCase();
  if (
    rawStockStatus === 'out_of_stock' ||
    rawStockStatus === 'rupture' ||
    (item.stock !== undefined && Number(item.stock) <= 0)
  ) {
    stockStatus = 'out_of_stock';
  } else if (
    rawStockStatus === 'low_stock' ||
    rawStockStatus === 'faible' ||
    (item.stock !== undefined && Number(item.stock) <= 2)
  ) {
    stockStatus = 'low_stock';
  } else {
    stockStatus = 'in_stock';
  }

  const categoryTitle =
    item.category?.titre || item.categoryLabel || item.category || 'Non classé';

  return {
    id: item.id,
    name: item.name || '',
    sku: item.sku || '',
    categoryId: item.categoryId || item.category?.id || null,
    category: (item.categoryId ||
      item.category?.id ||
      item.category ||
      'bamboo-bikes') as ProductCategory,
    categoryLabel: categoryTitle,
    price: Number(item.price || 0),
    stock: Number(item.stock || 0),
    status: stockStatus,
    statut: item.statut === 'INACTIVE' ? 'inactive' : 'active',
    isFeatured: Boolean(item.isFeatured),
    image: rawCover ? getMediaUrl(rawCover) : resolvedImages[0] || '',
    images: resolvedImages,
    description: item.description || '',
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString().slice(0, 10)
      : undefined,
  };
}

/**
 * Service API pour No Borders ASBL
 * Supporte automatiquement le mode réel (API Nexte avec Bearer token)
 * ou le mode démonstration réactif avec persistance locale.
 */
export const apiClient = {
  isDemoMode: FORCE_MOCK,
  apiBaseUrl: API_BASE_URL,

  async getOverview(): Promise<OverviewMetrics> {
    if (this.isDemoMode) {
      return overviewMetricsData;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/overview`, {
        headers: { credentials: 'include', Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('API unreachable');
      return await res.json();
    } catch {
      return overviewMetricsData;
    }
  },

  // PRODUITS (Admin)
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    stockStatus?: string;
    statut?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<Product[]> {
    if (this.isDemoMode) {
      return getStorageItem<Product[]>('products', initialProducts);
    }
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.search) query.set('search', params.search.trim());
      if (params?.categoryId && params.categoryId !== 'all') {
        query.set('categoryId', params.categoryId);
      }
      if (params?.stockStatus && params.stockStatus !== 'all') {
        query.set('stockStatus', params.stockStatus.toUpperCase());
      }
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/products?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des produits (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : [];

      return list.map(mapApiProductToItem);
    } catch (error) {
      console.warn('API getProducts failed, using local fallback', error);
      return getStorageItem<Product[]>('products', initialProducts);
    }
  },

  async getProductsPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    stockStatus?: string;
    statut?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: Product[]; total: number; page: number; totalPages: number }> {
    if (this.isDemoMode) {
      const all = getStorageItem<Product[]>('products', initialProducts);
      return { items: all, total: all.length, page: 1, totalPages: 1 };
    }
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search.trim());
      if (params?.categoryId && params.categoryId !== 'all') {
        query.set('categoryId', params.categoryId);
      }
      if (params?.stockStatus && params.stockStatus !== 'all') {
        query.set('stockStatus', params.stockStatus.toUpperCase());
      }
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/products?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des produits (${res.status})`,
        );
      }

      const rawItems: any[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : [];

      return {
        items: rawItems.map(mapApiProductToItem),
        total: typeof json?.total === 'number' ? json.total : rawItems.length,
        page: typeof json?.page === 'number' ? json.page : 1,
        totalPages: typeof json?.totalPages === 'number' ? json.totalPages : 1,
      };
    } catch (error) {
      console.warn('API getProductsPaginated failed, using local fallback', error);
      const all = getStorageItem<Product[]>('products', initialProducts);
      return { items: all, total: all.length, page: 1, totalPages: 1 };
    }
  },

  async getProductById(id: string): Promise<Product> {
    if (this.isDemoMode) {
      const all = getStorageItem<Product[]>('products', initialProducts);
      const found = all.find((p) => p.id === id);
      if (!found) throw new Error('Produit introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/products/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération du produit (${res.status})`,
      );
    }

    return mapApiProductToItem(json);
  },

  async saveProduct(product: any): Promise<Product> {
    if (this.isDemoMode) {
      const products = getStorageItem<Product[]>('products', initialProducts);
      let updated: Product;
      if (product.id) {
        const index = products.findIndex((p) => p.id === product.id);
        if (index !== -1) {
          updated = { ...products[index], ...product } as Product;
          products[index] = updated;
        } else {
          updated = product as Product;
        }
      } else {
        updated = {
          ...product,
          id: `prod-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        products.unshift(updated);
      }
      setStorageItem('products', products);
      return updated;
    }

    const isEdit = Boolean(product.id);
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/products/${product.id}`
      : `${this.apiBaseUrl}/admin/products`;

    const apiOrigin = this.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const normalizeMediaUrl = (u: string): string => {
      const trimmed = u.trim();
      if (trimmed.startsWith(`${apiOrigin}/uploads/`)) {
        return trimmed.slice(apiOrigin.length);
      }
      return trimmed;
    };

    const rawImages: string[] =
      product.images !== undefined
        ? product.images
        : product.image
        ? [product.image]
        : [];

    const imageFilesToUpload: File[] = [];
    const existingImageUrls: string[] = [];

    for (const img of rawImages) {
      if (!img || !img.trim()) continue;
      if (img.startsWith('data:')) {
        const file = dataUrlToFile(img, imageFilesToUpload.length);
        if (file) {
          imageFilesToUpload.push(file);
        }
      } else {
        existingImageUrls.push(normalizeMediaUrl(img));
      }
    }

    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    if (imageFilesToUpload.length > 0) {
      const form = new FormData();
      form.append('name', String(product.name || '').trim());
      form.append('sku', String(product.sku || '').trim().toUpperCase());
      form.append('price', String(product.price ?? 0));
      form.append('stock', String(product.stock ?? 0));
      form.append('isFeatured', String(Boolean(product.isFeatured)));
      if (product.categoryId) {
        form.append('categoryId', String(product.categoryId).trim());
      }
      if (product.description) {
        form.append('description', String(product.description).trim());
      }
      if (product.statut) {
        form.append(
          'statut',
          String(product.statut).toLowerCase() === 'inactive'
            ? 'INACTIVE'
            : 'ACTIVE',
        );
      }
      if (product.coverImage) {
        form.append('coverImage', normalizeMediaUrl(product.coverImage));
      }
      for (const file of imageFilesToUpload) {
        form.append('files', file);
      }
      if (existingImageUrls.length > 0) {
        form.append('images', JSON.stringify(existingImageUrls));
        if (isEdit) {
          form.append('existingImages', JSON.stringify(existingImageUrls));
        }
      }
      body = form;
    } else {
      const payload: Record<string, unknown> = {
        name: String(product.name || '').trim(),
        sku: String(product.sku || '').trim().toUpperCase(),
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? 0),
        isFeatured: Boolean(product.isFeatured),
        coverImage: product.coverImage ? normalizeMediaUrl(product.coverImage) : undefined,
        description: product.description ? String(product.description).trim() : null,
        categoryId: product.categoryId ? String(product.categoryId).trim() : null,
        statut:
          String(product.statut || 'active').toLowerCase() === 'inactive'
            ? 'INACTIVE'
            : 'ACTIVE',
        images: existingImageUrls,
      };
      if (isEdit) {
        payload.existingImages = existingImageUrls;
      }
      body = JSON.stringify(payload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de l'enregistrement du produit (${res.status})`,
      );
    }

    return mapApiProductToItem(json);
  },

  async toggleProductStatus(id: string): Promise<Product> {
    if (this.isDemoMode) {
      const products = getStorageItem<Product[]>('products', initialProducts);
      const product = products.find((p) => p.id === id);
      if (product) {
        product.statut = product.statut === 'inactive' ? 'active' : 'inactive';
        setStorageItem('products', products);
        return product;
      }
      throw new Error('Produit introuvable');
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/products/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors du basculement du statut du produit (${res.status})`,
      );
    }

    return mapApiProductToItem(json);
  },

  async deleteProduct(id: string): Promise<void> {
    if (this.isDemoMode) {
      const products = getStorageItem<Product[]>('products', initialProducts);
      const filtered = products.filter((p) => p.id !== id);
      setStorageItem('products', filtered);
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/products/${id}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la suppression du produit (${res.status})`,
      );
    }
  },

  // COMMANDES
  async getOrders(): Promise<Order[]> {
    return getStorageItem<Order[]>('orders', initialOrders);
  },

  async updateOrderStatus(id: string, shippingStatus: ShippingStatus, paymentStatus?: PaymentStatus): Promise<Order | null> {
    const orders = getStorageItem<Order[]>('orders', initialOrders);
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.shippingStatus = shippingStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      setStorageItem('orders', orders);
      return order;
    }
    return null;
  },

  async refundOrder(id: string, reason: string): Promise<Order | null> {
    const orders = getStorageItem<Order[]>('orders', initialOrders);
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.paymentStatus = 'refunded';
      order.refundReason = reason;
      setStorageItem('orders', orders);
      return order;
    }
    return null;
  },

  // CLIENTS
  async getCustomers(): Promise<Customer[]> {
    return getStorageItem<Customer[]>('customers', initialCustomers);
  },

  // DONS
  async getDonations(): Promise<Donation[]> {
    return getStorageItem<Donation[]>('donations', initialDonations);
  },

  async toggleTaxReceipt(id: string): Promise<Donation | null> {
    const donations = getStorageItem<Donation[]>('donations', initialDonations);
    const donation = donations.find((d) => d.id === id);
    if (donation) {
      donation.taxReceiptSent = !donation.taxReceiptSent;
      setStorageItem('donations', donations);
      return donation;
    }
    return null;
  },

  // CONTENUS DU SITE & ACTUALITÉS (ADMIN)
  async getContents(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    format?: string;
    langue?: string;
    search?: string;
  }): Promise<ContentItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<ContentItem[]>('contents', initialContents);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut);
      }
      if (params?.format && params.format !== 'all') {
        query.set('format', params.format);
      }
      if (params?.langue && params.langue !== 'all') {
        query.set('langue', params.langue);
      }
      if (params?.search) {
        query.set('search', params.search);
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/contents?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des publications (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiContentToItem);
    } catch (error) {
      console.warn('API getContents failed, using local fallback', error);
      return getStorageItem<ContentItem[]>('contents', initialContents);
    }
  },

  async getContentById(id: string): Promise<ContentItem> {
    if (this.isDemoMode) {
      const contents = getStorageItem<ContentItem[]>('contents', initialContents);
      const found = contents.find((c) => c.id === id);
      if (!found) throw new Error('Publication introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/contents/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération de la publication (${res.status})`,
      );
    }

    return mapApiContentToItem(json);
  },

  async saveContent(
    content: Partial<ContentItem> & {
      title: string;
      type?: any;
      locale?: any;
      videoFile?: File | null;
    },
  ): Promise<ContentItem> {
    if (this.isDemoMode) {
      const contents = getStorageItem<ContentItem[]>('contents', initialContents);
      let item: ContentItem;

      if (content.id) {
        const idx = contents.findIndex((c) => c.id === content.id);
        if (idx !== -1) {
          item = {
            ...contents[idx],
            ...content,
            viewsCount: contents[idx].viewsCount ?? 0,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as ContentItem;
          contents[idx] = item;
        } else {
          item = content as ContentItem;
        }
      } else {
        item = {
          id: `cnt-${Date.now()}`,
          title: content.title,
          slug: content.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          type: content.type || 'article',
          locale: content.locale || 'fr',
          status: content.status || 'draft',
          author: 'Équipe No Borders',
          updatedAt: new Date().toISOString().slice(0, 10),
          publishedAt:
            content.status === 'published'
              ? new Date().toISOString().slice(0, 10)
              : undefined,
          viewsCount: 0,
          image: content.image,
          images: content.images || [],
          video: content.video || '',
          content: content.content || '',
        };
        contents.unshift(item);
      }
      setStorageItem('contents', contents);
      return item;
    }

    const isEdit = !!content.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/contents/${content.id}`
      : `${this.apiBaseUrl}/admin/contents`;

    const apiOrigin = this.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const normalizeMediaUrl = (u: string): string => {
      const trimmed = u.trim();
      if (trimmed.startsWith(`${apiOrigin}/uploads/`)) {
        return trimmed.slice(apiOrigin.length);
      }
      return trimmed;
    };

    const rawImages =
      content.images !== undefined
        ? content.images
        : content.image
        ? [content.image]
        : [];

    const imageFilesToUpload: File[] = [];
    const orderedImageRefs: string[] = [];

    for (const img of rawImages) {
      if (!img || !img.trim()) continue;
      if (img.startsWith('data:')) {
        const file = dataUrlToFile(img, imageFilesToUpload.length);
        if (file) {
          orderedImageRefs.push(`__FILE_${imageFilesToUpload.length}__`);
          imageFilesToUpload.push(file);
        } else {
          orderedImageRefs.push(img.trim());
        }
      } else {
        orderedImageRefs.push(normalizeMediaUrl(img));
      }
    }

    let videoFileToUpload: File | null = content.videoFile || null;
    let videoUrlPayload = '';

    if (!videoFileToUpload && content.video && content.video.trim()) {
      const trimmedVideo = content.video.trim();
      if (trimmedVideo.startsWith('data:')) {
        videoFileToUpload = dataUrlToVideoFile(trimmedVideo);
      } else {
        videoUrlPayload = normalizeMediaUrl(trimmedVideo);
      }
    }

    const statutPayload =
      content.status === 'published' ? 'PUBLISHED' : 'DRAFT';
    const formatPayload = (content.type || 'article').trim();
    const languePayload = (content.locale || 'fr').trim();
    const contenuPayload = (content.content || '').trim();

    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    if (imageFilesToUpload.length > 0 || videoFileToUpload) {
      const form = new FormData();
      form.append('titre', content.title.trim());
      form.append('format', formatPayload);
      form.append('langue', languePayload);
      form.append('statut', statutPayload);
      form.append('contenu', contenuPayload);
      form.append('images', JSON.stringify(orderedImageRefs));
      for (const file of imageFilesToUpload) {
        form.append('files', file);
      }
      if (videoFileToUpload) {
        form.append('video', videoFileToUpload);
      } else {
        form.append('video', videoUrlPayload);
      }
      body = form;
    } else {
      const payload = {
        titre: content.title.trim(),
        format: formatPayload,
        langue: languePayload,
        statut: statutPayload,
        contenu: contenuPayload,
        images: orderedImageRefs,
        video: videoUrlPayload,
      };
      body = JSON.stringify(payload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement de la publication (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiContentToItem(json);
  },

  async toggleContentStatus(id: string): Promise<ContentItem | null> {
    if (this.isDemoMode) {
      const contents = getStorageItem<ContentItem[]>('contents', initialContents);
      const item = contents.find((c) => c.id === id);
      if (item) {
        item.status = item.status === 'published' ? 'draft' : 'published';
        item.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('contents', contents);
        return item;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/contents/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiContentToItem(json);
  },

  async deleteContent(id: string): Promise<void> {
    if (this.isDemoMode) {
      const contents = getStorageItem<ContentItem[]>('contents', initialContents);
      setStorageItem('contents', contents.filter((c) => c.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/contents/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression de la publication (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // MESSAGES DE CONTACT (ADMIN)
  async getContactMessages(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<ContactMessage[]> {
    if (this.isDemoMode) {
      return getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.isRead !== undefined) {
        query.set('isRead', String(params.isRead));
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/contact-messages?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des messages (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiContactMessageToItem);
    } catch (error) {
      console.warn('API getContactMessages failed, using local fallback', error);
      return getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
    }
  },

  async getContactMessage(id: string): Promise<ContactMessage> {
    if (this.isDemoMode) {
      const messages = getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
      const found = messages.find((m) => m.id === id);
      if (!found) throw new Error('Message introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/contact-messages/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération du message (${res.status})`,
      );
    }

    return mapApiContactMessageToItem(json);
  },

  async markContactMessageAsRead(id: string): Promise<ContactMessage | null> {
    if (this.isDemoMode) {
      const messages = getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
      const msg = messages.find((m) => m.id === id);
      if (msg) {
        if (msg.status === 'unread') {
          msg.status = 'read';
          setStorageItem('contact_messages', messages);
        }
        return msg;
      }
      return null;
    }

    // Dans l'API réelle NestJS, GET /admin/contact-messages/:id effectue automatiquement
    // le marquage isRead = true et renvoie le message à jour.
    return this.getContactMessage(id);
  },

  async deleteContactMessage(id: string): Promise<void> {
    if (this.isDemoMode) {
      const messages = getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
      setStorageItem('contact_messages', messages.filter((m) => m.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/contact-messages/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression du message (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // FAQ
  async getFaqs(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    categorie?: string;
  }): Promise<FaqItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<FaqItem[]>('faqs', initialFaqs);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }
      if (params?.categorie && params.categorie !== 'all') {
        query.set('categorie', params.categorie);
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/faqs?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des FAQs (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiFaqToItem);
    } catch (error) {
      console.warn('API getFaqs failed, using local fallback', error);
      return getStorageItem<FaqItem[]>('faqs', initialFaqs);
    }
  },

  async getFaq(id: string): Promise<FaqItem> {
    if (this.isDemoMode) {
      const faqs = getStorageItem<FaqItem[]>('faqs', initialFaqs);
      const found = faqs.find((f) => f.id === id);
      if (!found) throw new Error('FAQ introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/faqs/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération de la FAQ (${res.status})`,
      );
    }

    return mapApiFaqToItem(json);
  },

  async saveFaq(
    faq: Partial<FaqItem> & { question: string; answer: string; category?: string; status?: string },
  ): Promise<FaqItem> {
    if (this.isDemoMode) {
      const faqs = getStorageItem<FaqItem[]>('faqs', initialFaqs);
      let item: FaqItem;

      if (faq.id) {
        const idx = faqs.findIndex((f) => f.id === faq.id);
        if (idx !== -1) {
          item = {
            ...faqs[idx],
            ...faq,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as FaqItem;
          faqs[idx] = item;
        } else {
          item = faq as FaqItem;
        }
      } else {
        item = {
          id: `faq-${Date.now()}`,
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          status: (faq.status as any) || 'active',
          category: faq.category || 'Général',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        faqs.unshift(item);
      }
      setStorageItem('faqs', faqs);
      return item;
    }

    const payload = {
      question: faq.question.trim(),
      reponse: faq.answer.trim(),
      categorie: faq.category?.trim() || 'Général',
      statut: (faq.status || 'active').toUpperCase(),
    };

    const isEdit = !!faq.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/faqs/${faq.id}`
      : `${this.apiBaseUrl}/admin/faqs`;

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement de la FAQ (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiFaqToItem(json);
  },

  async toggleFaqStatus(id: string): Promise<FaqItem | null> {
    if (this.isDemoMode) {
      const faqs = getStorageItem<FaqItem[]>('faqs', initialFaqs);
      const faq = faqs.find((f) => f.id === id);
      if (faq) {
        faq.status = faq.status === 'active' ? 'inactive' : 'active';
        faq.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('faqs', faqs);
        return faq;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/faqs/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiFaqToItem(json);
  },

  async deleteFaq(id: string): Promise<void> {
    if (this.isDemoMode) {
      const faqs = getStorageItem<FaqItem[]>('faqs', initialFaqs);
      setStorageItem('faqs', faqs.filter((f) => f.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/faqs/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression de la FAQ (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // ACTIVITÉS (ADMIN)
  async getActivities(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    categorie?: string;
  }): Promise<ActivityItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<ActivityItem[]>('activities', initialActivities);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }
      if (params?.categorie && params.categorie !== 'all') {
        query.set('categorie', params.categorie);
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/activities?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des activités (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiActivityToItem);
    } catch (error) {
      console.warn('API getActivities failed, using local fallback', error);
      return getStorageItem<ActivityItem[]>('activities', initialActivities);
    }
  },

  async getActivityById(id: string): Promise<ActivityItem> {
    if (this.isDemoMode) {
      const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
      const found = activities.find((a) => a.id === id);
      if (!found) throw new Error('Activité introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/activities/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération de l'activité (${res.status})`,
      );
    }

    return mapApiActivityToItem(json);
  },

  async saveActivity(
    activity: Partial<ActivityItem> & { title: string; description: string },
  ): Promise<ActivityItem> {
    if (this.isDemoMode) {
      const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
      let item: ActivityItem;

      const images =
        activity.images && activity.images.length > 0
          ? activity.images
          : activity.image
          ? [activity.image]
          : [];

      if (activity.id) {
        const idx = activities.findIndex((a) => a.id === activity.id);
        if (idx !== -1) {
          item = {
            ...activities[idx],
            ...activity,
            image: images[0] || '',
            images,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as ActivityItem;
          activities[idx] = item;
        } else {
          item = activity as ActivityItem;
        }
      } else {
        item = {
          id: `act-${Date.now()}`,
          title: activity.title.trim(),
          category: activity.category || 'Ateliers Bambou',
          description: activity.description.trim(),
          status: activity.status || 'active',
          image: images[0] || '',
          images,
          date: activity.date || '',
          location: activity.location || '',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        activities.unshift(item);
      }
      setStorageItem('activities', activities);
      return item;
    }

    const isEdit = !!activity.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/activities/${activity.id}`
      : `${this.apiBaseUrl}/admin/activities`;

    const apiOrigin = this.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const normalizeImageUrl = (u: string): string => {
      const trimmed = u.trim();
      if (trimmed.startsWith(`${apiOrigin}/uploads/`)) {
        return trimmed.slice(apiOrigin.length);
      }
      return trimmed;
    };

    const rawImages =
      activity.images !== undefined
        ? activity.images
        : activity.image
        ? [activity.image]
        : [];

    const filesToUpload: File[] = [];
    const orderedImageRefs: string[] = [];

    for (const img of rawImages) {
      if (!img || !img.trim()) continue;
      if (img.startsWith('data:')) {
        const file = dataUrlToFile(img, filesToUpload.length);
        if (file) {
          orderedImageRefs.push(`__FILE_${filesToUpload.length}__`);
          filesToUpload.push(file);
        } else {
          orderedImageRefs.push(img.trim());
        }
      } else {
        orderedImageRefs.push(normalizeImageUrl(img));
      }
    }

    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    const cleanDate = (activity.date || '').trim();
    const cleanLieu = (activity.location || '').trim();

    if (filesToUpload.length > 0) {
      const form = new FormData();
      form.append('titre', activity.title.trim());
      form.append('categorie', (activity.category || 'Ateliers Bambou').trim());
      form.append('date', cleanDate);
      form.append('lieu', cleanLieu);
      form.append('description', activity.description.trim());
      form.append('statut', (activity.status || 'active').toUpperCase());
      form.append('images', JSON.stringify(orderedImageRefs));
      for (const file of filesToUpload) {
        form.append('files', file);
      }
      body = form;
    } else {
      const payload = {
        titre: activity.title.trim(),
        categorie: (activity.category || 'Ateliers Bambou').trim(),
        date: cleanDate,
        lieu: cleanLieu,
        description: activity.description.trim(),
        statut: (activity.status || 'active').toUpperCase(),
        images: orderedImageRefs,
      };
      body = JSON.stringify(payload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement de l'activité (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiActivityToItem(json);
  },

  async toggleActivityStatus(id: string): Promise<ActivityItem | null> {
    if (this.isDemoMode) {
      const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
      const activity = activities.find((a) => a.id === id);
      if (activity) {
        activity.status = activity.status === 'active' ? 'inactive' : 'active';
        activity.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('activities', activities);
        return activity;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/activities/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiActivityToItem(json);
  },

  async deleteActivity(id: string): Promise<void> {
    if (this.isDemoMode) {
      const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
      setStorageItem('activities', activities.filter((a) => a.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/activities/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression de l'activité (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // PRESSE (ADMIN)
  async getPressItems(params?: {
    page?: number;
    limit?: number;
    statut?: string;
  }): Promise<PressItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<PressItem[]>('press_items', initialPressItems);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/press?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des éléments de presse (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiPressToItem);
    } catch (error) {
      console.warn('API getPressItems failed, using local fallback', error);
      return getStorageItem<PressItem[]>('press_items', initialPressItems);
    }
  },

  async getPressItemById(id: string): Promise<PressItem> {
    if (this.isDemoMode) {
      const allPress = getStorageItem<PressItem[]>('press_items', initialPressItems);
      const found = allPress.find((p) => p.id === id);
      if (!found) throw new Error('Élément de presse introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/press/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération de l'élément de presse (${res.status})`,
      );
    }

    return mapApiPressToItem(json);
  },

  async savePressItem(
    pressItem: Partial<PressItem> & {
      title: string;
      imageFile?: File | null;
    },
  ): Promise<PressItem> {
    if (this.isDemoMode) {
      const allPress = getStorageItem<PressItem[]>('press_items', initialPressItems);
      let item: PressItem;

      if (pressItem.id) {
        const idx = allPress.findIndex((p) => p.id === pressItem.id);
        if (idx !== -1) {
          item = {
            ...allPress[idx],
            ...pressItem,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as PressItem;
          allPress[idx] = item;
        } else {
          item = pressItem as PressItem;
        }
      } else {
        item = {
          id: `press-${Date.now()}`,
          title: pressItem.title.trim(),
          description: (pressItem.description || '').trim(),
          link: pressItem.link?.trim() || '',
          image: pressItem.image || '',
          source: pressItem.source || 'Presse & Médias',
          status: pressItem.status || 'active',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        allPress.unshift(item);
      }
      setStorageItem('press_items', allPress);
      return item;
    }

    const isEdit = !!pressItem.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/press/${pressItem.id}`
      : `${this.apiBaseUrl}/admin/press`;

    const hasFile = pressItem.imageFile instanceof File;
    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    const apiOrigin = this.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const normalizeImageValue = (img?: string) => {
      if (img === undefined) return undefined;
      const trimmed = img.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith(`${apiOrigin}/uploads/`)) {
        return trimmed.slice(apiOrigin.length);
      }
      return trimmed;
    };

    if (hasFile && pressItem.imageFile) {
      const form = new FormData();
      form.append('titre', pressItem.title.trim());
      form.append('statut', (pressItem.status || 'active').toUpperCase());
      if (pressItem.source !== undefined) {
        form.append('source', pressItem.source.trim());
      }
      if (pressItem.link !== undefined) {
        form.append('lien', pressItem.link.trim());
      }
      if (pressItem.description !== undefined) {
        form.append('description', pressItem.description.trim());
      }
      form.append('image', pressItem.imageFile);
      body = form;
    } else {
      const payload: Record<string, string> = {
        titre: pressItem.title.trim(),
        statut: (pressItem.status || 'active').toUpperCase(),
      };
      if (pressItem.source !== undefined) {
        payload.source = pressItem.source.trim();
      }
      if (pressItem.link !== undefined) {
        payload.lien = pressItem.link.trim();
      }
      if (pressItem.description !== undefined) {
        payload.description = pressItem.description.trim();
      }
      const normalizedImage = normalizeImageValue(pressItem.image);
      if (normalizedImage !== undefined) {
        payload.image = normalizedImage;
      }
      body = JSON.stringify(payload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement de l'élément de presse (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiPressToItem(json);
  },

  async togglePressItemStatus(id: string): Promise<PressItem | null> {
    if (this.isDemoMode) {
      const allPress = getStorageItem<PressItem[]>('press_items', initialPressItems);
      const item = allPress.find((p) => p.id === id);
      if (item) {
        item.status = item.status === 'active' ? 'inactive' : 'active';
        item.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('press_items', allPress);
        return item;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/press/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiPressToItem(json);
  },

  async deletePressItem(id: string): Promise<void> {
    if (this.isDemoMode) {
      const allPress = getStorageItem<PressItem[]>('press_items', initialPressItems);
      setStorageItem('press_items', allPress.filter((p) => p.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/press/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression de l'élément de presse (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // PARTENAIRES (ADMIN)
  async getPartners(params?: {
    page?: number;
    limit?: number;
    statut?: string;
  }): Promise<PartnerItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<PartnerItem[]>('partners', initialPartners);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/partners?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des partenaires (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiPartnerToItem);
    } catch (error) {
      console.warn('API getPartners failed, using local fallback', error);
      return getStorageItem<PartnerItem[]>('partners', initialPartners);
    }
  },

  async getPartnerById(id: string): Promise<PartnerItem> {
    if (this.isDemoMode) {
      const allPartners = getStorageItem<PartnerItem[]>('partners', initialPartners);
      const found = allPartners.find((p) => p.id === id);
      if (!found) throw new Error('Partenaire introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/partners/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération du partenaire (${res.status})`,
      );
    }

    return mapApiPartnerToItem(json);
  },

  async savePartner(
    partnerData: Partial<PartnerItem> & {
      name: string;
      logo?: string;
      status?: string;
      logoFile?: File | null;
    },
  ): Promise<PartnerItem> {
    if (this.isDemoMode) {
      const allPartners = getStorageItem<PartnerItem[]>('partners', initialPartners);
      let item: PartnerItem;

      if (partnerData.id) {
        const idx = allPartners.findIndex((p) => p.id === partnerData.id);
        if (idx !== -1) {
          item = {
            ...allPartners[idx],
            ...partnerData,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as PartnerItem;
          allPartners[idx] = item;
        } else {
          item = partnerData as PartnerItem;
        }
      } else {
        item = {
          id: `part-${Date.now()}`,
          name: partnerData.name.trim(),
          logo: partnerData.logo || '',
          status: (partnerData.status as any) || 'active',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        allPartners.unshift(item);
      }
      setStorageItem('partners', allPartners);
      return item;
    }

    const isEdit = !!partnerData.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/partners/${partnerData.id}`
      : `${this.apiBaseUrl}/admin/partners`;

    const hasFile = partnerData.logoFile instanceof File;
    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    if (hasFile && partnerData.logoFile) {
      const form = new FormData();
      form.append('nom', partnerData.name.trim());
      form.append('statut', (partnerData.status || 'active').toUpperCase());
      form.append('logo', partnerData.logoFile);
      body = form;
    } else {
      const payload: Record<string, string> = {
        nom: partnerData.name.trim(),
        statut: (partnerData.status || 'active').toUpperCase(),
      };
      if (partnerData.logo) {
        payload.logo = partnerData.logo.trim();
      }
      body = JSON.stringify(payload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement du partenaire (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiPartnerToItem(json);
  },

  async togglePartnerStatus(id: string): Promise<PartnerItem | null> {
    if (this.isDemoMode) {
      const allPartners = getStorageItem<PartnerItem[]>('partners', initialPartners);
      const item = allPartners.find((p) => p.id === id);
      if (item) {
        item.status = item.status === 'active' ? 'inactive' : 'active';
        item.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('partners', allPartners);
        return item;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/partners/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiPartnerToItem(json);
  },

  async deletePartner(id: string): Promise<void> {
    if (this.isDemoMode) {
      const allPartners = getStorageItem<PartnerItem[]>('partners', initialPartners);
      setStorageItem('partners', allPartners.filter((p) => p.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/partners/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression du partenaire (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // CATÉGORIES DE PRODUITS (ADMIN)
  async getCategories(params?: {
    page?: number;
    limit?: number;
    statut?: string;
  }): Promise<CategoryItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<CategoryItem[]>('product_categories', initialCategories);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/categories?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des catégories (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiCategoryToItem);
    } catch (error) {
      console.warn('API getCategories failed, using local fallback', error);
      return getStorageItem<CategoryItem[]>('product_categories', initialCategories);
    }
  },

  async getCategoryById(id: string): Promise<CategoryItem> {
    if (this.isDemoMode) {
      const allCategories = getStorageItem<CategoryItem[]>('product_categories', initialCategories);
      const found = allCategories.find((c) => c.id === id);
      if (!found) throw new Error('Catégorie introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/categories/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération de la catégorie (${res.status})`,
      );
    }

    return mapApiCategoryToItem(json);
  },

  async saveCategory(
    categoryData: Partial<CategoryItem> & {
      title: string;
      imageFile?: File | null;
    },
  ): Promise<CategoryItem> {
    if (this.isDemoMode) {
      const allCategories = getStorageItem<CategoryItem[]>('product_categories', initialCategories);
      let item: CategoryItem;

      if (categoryData.id) {
        const idx = allCategories.findIndex((c) => c.id === categoryData.id);
        if (idx !== -1) {
          item = {
            ...allCategories[idx],
            ...categoryData,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as CategoryItem;
          allCategories[idx] = item;
        } else {
          item = categoryData as CategoryItem;
        }
      } else {
        item = {
          id: `cat-${Date.now()}`,
          title: categoryData.title.trim(),
          description: (categoryData.description || '').trim(),
          image: categoryData.image || '',
          status: categoryData.status || 'active',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        allCategories.unshift(item);
      }
      setStorageItem('product_categories', allCategories);
      return item;
    }

    const isEdit = !!categoryData.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/categories/${categoryData.id}`
      : `${this.apiBaseUrl}/admin/categories`;

    const hasFile = categoryData.imageFile instanceof File;
    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    const apiOrigin = this.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const normalizeImageValue = (img?: string) => {
      if (img === undefined) return undefined;
      const trimmed = img.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith(`${apiOrigin}/uploads/`)) {
        return trimmed.slice(apiOrigin.length);
      }
      return trimmed;
    };

    if (hasFile && categoryData.imageFile) {
      const form = new FormData();
      form.append('titre', categoryData.title.trim());
      form.append('statut', (categoryData.status || 'active').toUpperCase());
      if (categoryData.description !== undefined) {
        form.append('description', categoryData.description.trim());
      }
      form.append('image', categoryData.imageFile);
      body = form;
    } else {
      const payload: Record<string, string> = {
        titre: categoryData.title.trim(),
        statut: (categoryData.status || 'active').toUpperCase(),
      };
      if (categoryData.description !== undefined) {
        payload.description = categoryData.description.trim();
      }
      const normalizedImage = normalizeImageValue(categoryData.image);
      if (normalizedImage !== undefined) {
        payload.image = normalizedImage;
      }
      body = JSON.stringify(payload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement de la catégorie (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiCategoryToItem(json);
  },

  async toggleCategoryStatus(id: string): Promise<CategoryItem | null> {
    if (this.isDemoMode) {
      const allCategories = getStorageItem<CategoryItem[]>('product_categories', initialCategories);
      const item = allCategories.find((c) => c.id === id);
      if (item) {
        item.status = item.status === 'active' ? 'inactive' : 'active';
        item.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('product_categories', allCategories);
        return item;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/categories/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiCategoryToItem(json);
  },

  async deleteCategory(id: string): Promise<void> {
    if (this.isDemoMode) {
      const allCategories = getStorageItem<CategoryItem[]>('product_categories', initialCategories);
      setStorageItem('product_categories', allCategories.filter((c) => c.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/categories/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression de la catégorie (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // PARCOURS
  // PARCOURS (ADMIN)
  async getParcours(params?: {
    page?: number;
    limit?: number;
    statut?: string;
  }): Promise<ParcoursItem[]> {
    if (this.isDemoMode) {
      return getStorageItem<ParcoursItem[]>('parcours', initialParcours);
    }

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      query.set('limit', String(params?.limit || 100));
      if (params?.statut && params.statut !== 'all') {
        query.set('statut', params.statut.toUpperCase());
      }

      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/admin/parcours?${query.toString()}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && (json.message || json.error)) ||
            `Erreur lors de la récupération des parcours (${res.status})`,
        );
      }

      const list: any[] = Array.isArray(json) ? json : json?.data || [];
      return list.map(mapApiParcoursToItem);
    } catch (error) {
      console.warn('API getParcours failed, using local fallback', error);
      return getStorageItem<ParcoursItem[]>('parcours', initialParcours);
    }
  },

  async getParcoursById(id: string): Promise<ParcoursItem> {
    if (this.isDemoMode) {
      const allParcours = getStorageItem<ParcoursItem[]>('parcours', initialParcours);
      const found = allParcours.find((p) => p.id === id);
      if (!found) throw new Error('Parcours introuvable');
      return found;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/parcours/${id}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (json && (json.message || json.error)) ||
          `Erreur lors de la récupération du parcours (${res.status})`,
      );
    }

    return mapApiParcoursToItem(json);
  },

  async saveParcours(
    parcoursData: Partial<ParcoursItem> & { title: string; description?: string; period?: string; status?: string },
  ): Promise<ParcoursItem> {
    if (this.isDemoMode) {
      const allParcours = getStorageItem<ParcoursItem[]>('parcours', initialParcours);
      let item: ParcoursItem;

      if (parcoursData.id) {
        const idx = allParcours.findIndex((p) => p.id === parcoursData.id);
        if (idx !== -1) {
          item = {
            ...allParcours[idx],
            ...parcoursData,
            updatedAt: new Date().toISOString().slice(0, 10),
          } as ParcoursItem;
          allParcours[idx] = item;
        } else {
          item = parcoursData as ParcoursItem;
        }
      } else {
        item = {
          id: `parc-${Date.now()}`,
          title: parcoursData.title.trim(),
          description: (parcoursData.description || '').trim(),
          period: (parcoursData.period || '').trim(),
          status: (parcoursData.status as any) || 'active',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        allParcours.unshift(item);
      }
      setStorageItem('parcours', allParcours);
      return item;
    }

    const payload = {
      titre: parcoursData.title.trim(),
      description: (parcoursData.description || '').trim(),
      annee: (parcoursData.period || '').trim(),
      statut: (parcoursData.status || 'active').toUpperCase(),
    };

    const isEdit = !!parcoursData.id;
    const url = isEdit
      ? `${this.apiBaseUrl}/admin/parcours/${parcoursData.id}`
      : `${this.apiBaseUrl}/admin/parcours`;

    const res = await this.requestWithAuth(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de l'enregistrement du parcours (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiParcoursToItem(json);
  },

  async toggleParcoursStatus(id: string): Promise<ParcoursItem | null> {
    if (this.isDemoMode) {
      const allParcours = getStorageItem<ParcoursItem[]>('parcours', initialParcours);
      const item = allParcours.find((p) => p.id === id);
      if (item) {
        item.status = item.status === 'active' ? 'inactive' : 'active';
        item.updatedAt = new Date().toISOString().slice(0, 10);
        setStorageItem('parcours', allParcours);
        return item;
      }
      return null;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/parcours/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors du changement de statut (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return mapApiParcoursToItem(json);
  },

  async deleteParcours(id: string): Promise<void> {
    if (this.isDemoMode) {
      const allParcours = getStorageItem<ParcoursItem[]>('parcours', initialParcours);
      setStorageItem('parcours', allParcours.filter((p) => p.id !== id));
      return;
    }

    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/admin/parcours/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const errorMessage =
        (json && (json.message || json.error)) ||
        `Erreur lors de la suppression du parcours (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }
  },

  // PAIEMENTS (CONSULTATION SEULE)
  async getPayments(): Promise<PaymentRecord[]> {
    return getStorageItem<PaymentRecord[]>('payments_records', initialPayments);
  },

  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    const allPayments = getStorageItem<PaymentRecord[]>('payments_records', initialPayments);
    return allPayments.find((p) => p.id === id || p.reference === id) || null;
  },

  // UTILISATEURS & PERMISSIONS (Connecté à l'API Backend)
  async getUsers(): Promise<DashboardUser[]> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/users`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la récupération des utilisateurs (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    const rawList = Array.isArray(data) ? data : data?.data || [];
    return rawList.map((u: any) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      name: u.name || `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email,
      email: u.email,
      role: u.role,
      roleLabel:
        u.roleLabel ||
        (u.role === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Utilisateur'),
      status: String(u.status || 'ACTIVE').toLowerCase(),
      permissions: u.permissions || [],
      avatar: u.profilePhotoUrl ? getMediaUrl(u.profilePhotoUrl) : undefined,
      activeRole: u.activeRole || null,
      invitation: u.invitation || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })) as DashboardUser[];
  },

  async getUser(id: string): Promise<DashboardUser> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/users/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Utilisateur introuvable (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    const u = data;
    return {
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      name: u.name || `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email,
      email: u.email,
      role: u.role,
      roleLabel:
        u.roleLabel ||
        (u.role === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Utilisateur'),
      status: String(u.status || 'ACTIVE').toLowerCase(),
      permissions: u.permissions || [],
      avatar: u.profilePhotoUrl ? getMediaUrl(u.profilePhotoUrl) : undefined,
      activeRole: u.activeRole || null,
      invitation: u.invitations?.[0] || u.invitation || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    } as DashboardUser;
  },

  /**
   * Création d'un utilisateur avec envoi d'invitation (POST /invitations)
   */
  async createAdminInvitation(payload: {
    nom: string;
    prenom: string;
    email: string;
    role_id: string;
  }): Promise<{ message: string; invitation?: any; email_sent?: boolean }> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la création de l'invitation (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return data;
  },

  /**
   * Renvoi d'un e-mail d'invitation à un utilisateur en attente d'activation (POST /invitations/resend)
   */
  async resendInvitation(payload: {
    email?: string;
    userId?: string;
    invitationId?: string;
  }): Promise<{ message: string; invitation_id?: string }> {
    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/invitations/resend`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors du renvoi de l'invitation (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return data;
  },

  async updateUserRole(id: string, role: DashboardUser['role'], status: DashboardUser['status']): Promise<DashboardUser | null> {
    return null;
  },

  // PROFIL ACTUEL
  async getCurrentUser(): Promise<DashboardUser> {
    const users = getStorageItem<DashboardUser[]>('users', initialUsers);
    return users[0] || initialUsers[0];
  },

  async updateCurrentUser(data: Partial<DashboardUser>): Promise<DashboardUser> {
    const users = getStorageItem<DashboardUser[]>('users', initialUsers);
    if (users.length > 0) {
      users[0] = { ...users[0], ...data };
      setStorageItem('users', users);
      return users[0];
    }
    return initialUsers[0];
  },

  // PARAMÈTRES
  async getSettings(): Promise<SettingsState> {
    return getStorageItem<SettingsState>('settings', initialSettings);
  },

  async saveSettings(settings: SettingsState): Promise<SettingsState> {
    setStorageItem('settings', settings);
    return settings;
  },


















  
  // AUTHENTIFICATION
  _csrfToken: null as string | null,
  _csrfPromise: null as Promise<string | null> | null,

  async initCsrf(force = false): Promise<string | null> {
    if (!force) {
      const existing = this._csrfToken || getCookie('csrf_token');
      if (existing) {
        this._csrfToken = existing;
        return existing;
      }
    }

    if (this._csrfPromise) {
      return this._csrfPromise;
    }

    this._csrfPromise = (async () => {
      try {
        const res = await fetch(`${this.apiBaseUrl}/auth/csrf`, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => null);
        const token = data?.csrfToken || getCookie('csrf_token') || null;
        if (token) {
          this._csrfToken = token;
        }
        return token;
      } catch (error) {
        console.warn('Impossible d’initialiser le jeton CSRF', error);
        return this._csrfToken || getCookie('csrf_token');
      } finally {
        this._csrfPromise = null;
      }
    })();

    return this._csrfPromise;
  },

  /**
   * Prechauffage non-bloquant du cookie CSRF.
   * Appeler au montage des pages d'auth pour que le cookie soit present
   * avant que l'utilisateur clique sur Soumettre. Fire-and-forget.
   */
  warmupCsrf(): void {
    if (typeof window === 'undefined') return;
    if (getCookie('csrf_token') || this._csrfToken || this._csrfPromise) return;
    this.initCsrf().catch(() => { /* echec silencieux */ });
  },

  async login(credentials: { email: string; password: string }): Promise<
    | { status: '2fa_required'; message?: string }
    | {
        status: '2fa_setup_required';
        qr_uri: string;
        qr_code_svg: string;
        manual_key: string;
      }
    | {
        status?: 'success';
        message?: string;
        user: any;
      }
  > {
    // Si un cookie CSRF n'est pas encore présent, tenter de l'initialiser
    let csrfToken = getCookie('csrf_token') || this._csrfToken;
    if (!csrfToken) {
      csrfToken = await this.initCsrf();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(credentials),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur de connexion (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    if (data && data.user) {
      this.setSessionUser(data.user);
    }

    const updatedCsrf = getCookie('csrf_token');
    if (updatedCsrf) {
      this._csrfToken = updatedCsrf;
    }

    return data;
  },

  // GESTION DU FLUX 2FA TEMPORAIRE (Mémoire d'exécution uniquement)
  // Ne persiste JAMAIS dans localStorage ou sessionStorage
  _twoFactorSetupData: null as {
    qr_uri: string;
    qr_code_svg: string;
    manual_key: string;
  } | null,

  setTwoFactorSetupData(data: {
    qr_uri: string;
    qr_code_svg: string;
    manual_key: string;
  } | null): void {
    this._twoFactorSetupData = data;
  },

  getTwoFactorSetupData(): {
    qr_uri: string;
    qr_code_svg: string;
    manual_key: string;
  } | null {
    return this._twoFactorSetupData;
  },

  clearTwoFactorSetupData(): void {
    this._twoFactorSetupData = null;
  },

  // GESTION TEMPORAIRE DE L'EMAIL POUR LA RÉCUPÉRATION DU MOT DE PASSE
  // Mémoire d'exécution uniquement : ne persiste JAMAIS dans localStorage ou sessionStorage
  _resetPasswordEmail: null as string | null,

  setResetPasswordEmail(email: string | null): void {
    this._resetPasswordEmail = email;
  },

  getResetPasswordEmail(): string | null {
    return this._resetPasswordEmail;
  },

  clearResetPasswordEmail(): void {
    this._resetPasswordEmail = null;
  },

  async confirmTwoFactor(code: string): Promise<{
    message: string;
    recovery_codes: string[];
    user: any;
  }> {
    let csrfToken = getCookie('csrf_token') || this._csrfToken;
    if (!csrfToken) {
      csrfToken = await this.initCsrf();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/admin/2fa/confirm`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ code }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur de confirmation 2FA (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    // Nettoyer les données sensibles de configuration une fois le 2FA confirmé
    this.clearTwoFactorSetupData();

    if (data && data.user) {
      this.setSessionUser(data.user);
    }

    const updatedCsrf = getCookie('csrf_token');
    if (updatedCsrf) {
      this._csrfToken = updatedCsrf;
    }

    return data;
  },

  async verifyTwoFactor(payload: {
    code?: string;
    recovery_code?: string;
  }): Promise<{
    message: string;
    user: any;
  }> {
    let csrfToken = getCookie('csrf_token') || this._csrfToken;
    if (!csrfToken) {
      csrfToken = await this.initCsrf();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/admin/2fa/verify`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur de vérification 2FA (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    if (data && data.user) {
      this.setSessionUser(data.user);
    }

    const updatedCsrf = getCookie('csrf_token');
    if (updatedCsrf) {
      this._csrfToken = updatedCsrf;
    }

    return data;
  },

  // GESTION DU CACHE DE SESSION EN MÉMOIRE D'EXÉCUTION (Client In-Memory Session Cache)
  // Ne persiste JAMAIS dans localStorage ou sessionStorage (conforme aux contraintes de sécurité absolues)
  // Permet une navigation instantanée et fluide sans déclencher de spinner intrusif à chaque page
  _cachedUser: null as {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    statut_compte?: string;
    is_verified?: boolean;
    profile_photo_url?: string | null;
    profile?: any;
    created_at?: string;
  } | null,
  _sessionStatus: 'unknown' as 'unknown' | 'authenticated' | 'unauthenticated',
  _lastSessionCheck: 0 as number,
  _getMePromise: null as Promise<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    statut_compte?: string;
    is_verified?: boolean;
    profile_photo_url?: string | null;
    profile?: any;
    created_at?: string;
  } | null> | null,

  getCachedUser(): {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    statut_compte?: string;
    is_verified?: boolean;
    profile_photo_url?: string | null;
    profile?: any;
    created_at?: string;
  } | null {
    const now = Date.now();
    // Cache valide pendant 30 secondes en mémoire d'exécution
    if (
      this._sessionStatus === 'authenticated' &&
      this._cachedUser &&
      now - this._lastSessionCheck < 30000
    ) {
      return this._cachedUser;
    }
    return null;
  },

  getSessionStatus(): 'unknown' | 'authenticated' | 'unauthenticated' {
    return this._sessionStatus;
  },

  setSessionUser(user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    statut_compte?: string;
    is_verified?: boolean;
    profile_photo_url?: string | null;
    profile?: any;
    created_at?: string;
  } | null): void {
    this._cachedUser = user;
    this._sessionStatus = user ? 'authenticated' : 'unauthenticated';
    this._lastSessionCheck = user ? Date.now() : 0;
    if (typeof window !== 'undefined' && user) {
      window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
    }
  },

  clearSessionCache(): void {
    this._cachedUser = null;
    this._sessionStatus = 'unauthenticated';
    this._lastSessionCheck = 0;
  },

  /**
   * Vérifie la session auprès du backend NestJS via l'endpoint sécurisé GET /auth/me.
   * Transmet les cookies HTTP-only via credentials: 'include'.
   * Utilise le cache mémoire pour éviter les requêtes redondantes (TTL 30s)
   * et le single flight pattern pour mutualiser les requêtes parallèles.
   * Retourne l'utilisateur authentifié ou null si la session est absente, expirée ou invalide.
   */
  async getMe(options?: { force?: boolean }): Promise<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    role_label?: string;
    roleLabel?: string;
    role_item?: {
      id: string;
      name: string;
      label: string;
      description?: string | null;
    } | null;
    roleItem?: {
      id: string;
      name: string;
      label: string;
      description?: string | null;
    } | null;
    statut_compte?: string;
    is_verified?: boolean;
    profile_photo_url?: string | null;
    profile?: any;
    created_at?: string;
  } | null> {
    const force = options?.force ?? false;
    const now = Date.now();

    // 1. Si cache en mémoire encore valide (< 30s) et pas de revalidation forcée, renvoyer immédiatement
    if (
      !force &&
      this._sessionStatus === 'authenticated' &&
      this._cachedUser &&
      now - this._lastSessionCheck < 30000
    ) {
      return this._cachedUser;
    }

    // 2. Si un appel getMe() est déjà en cours d'exécution, mutualiser la promesse (single flight)
    if (this._getMePromise) {
      return this._getMePromise;
    }

    this._getMePromise = (async () => {
      try {
        const res = await this.requestWithAuth(`${this.apiBaseUrl}/auth/me`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          this.clearSessionCache();
          return null;
        }

        const data = await res.json().catch(() => null);
        if (!data || !data.user) {
          this.clearSessionCache();
          return null;
        }

        this.setSessionUser(data.user);
        return data.user;
      } catch (error) {
        console.warn('Erreur lors de la vérification de session /auth/me', error);
        return null;
      } finally {
        this._getMePromise = null;
      }
    })();

    return this._getMePromise;
  },

  // VERROU DE RENOUVELLEMENT PARTAGÉ (Single flight pattern)
  // Mutualise les appels refresh simultanés en une seule promesse en vol
  _refreshPromise: null as Promise<boolean> | null,

  /**
   * Renouvelle les cookies de session auprès du backend NestJS (POST /auth/refresh).
   * Laisse le backend effectuer la rotation atomique du refresh token.
   * Si plusieurs requêtes 401 surviennent en parallèle, elles partagent la même promesse.
   * Retourne true si le renouvellement réussit, false si la session est expirée/invalide.
   */
  async refreshToken(): Promise<boolean> {
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = (async () => {
      try {
        let csrfToken = this._csrfToken || getCookie('csrf_token');
        if (!csrfToken) {
          csrfToken = await this.initCsrf();
        }

        const headers: Record<string, string> = {
          Accept: 'application/json',
        };

        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken;
        }

        const res = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers,
        });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          const updatedCsrf = data?.csrfToken || getCookie('csrf_token');
          if (updatedCsrf) {
            this._csrfToken = updatedCsrf;
          }
          return true;
        }

        // Si le serveur répond 401 ou 403, le refresh token est expiré, révoqué ou réutilisé
        return false;
      } catch (networkError) {
        // En cas d'erreur réseau pure (offline, serveur injoignable), propager ou retourner false
        console.warn('Erreur réseau lors du renouvellement de session', networkError);
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  },

  /**
   * Wrapper centralisé pour exécuter des requêtes protégées avec renouvellement transparent (Silent Refresh).
   * - Transmet credentials: 'include'.
   * - Injecte le jeton CSRF pour les requêtes mutatives (POST, PUT, PATCH, DELETE).
   * - En cas de réponse 401 (access_token expiré), tente un renouvellement unique via refreshToken().
   * - Si le renouvellement réussit, rejoue la requête originale une seule fois.
   * - Si le renouvellement échoue, renvoie la réponse 401 pour permettre la redirection propre.
   */
  async requestWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      (init.method || 'GET').toUpperCase(),
    );

    let csrfToken = this._csrfToken || getCookie('csrf_token');
    if (isMutation && !csrfToken) {
      csrfToken = await this.initCsrf();
    }

    const headers = new Headers(init.headers || {});
    if (isMutation && csrfToken && !headers.has('x-csrf-token')) {
      headers.set('x-csrf-token', csrfToken);
    }

    const requestConfig: RequestInit = {
      ...init,
      credentials: 'include',
      headers,
    };

    // Première tentative
    let response = await fetch(url, requestConfig);

    // Si une requête mutative échoue avec 403 à cause d'un jeton CSRF désynchronisé, réinitialiser le CSRF et réessayer une fois
    if (isMutation && response.status === 403) {
      const freshCsrf = await this.initCsrf(true);
      if (freshCsrf) {
        headers.set('x-csrf-token', freshCsrf);
        response = await fetch(url, {
          ...requestConfig,
          headers,
        });
      }
    }

    // Si la requête échoue avec 401 (access_token expiré) et n'est pas déjà un appel de refresh ou auth public
    if (response.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
      // Cloner la réponse pour inspecter le motif du 401.
      // Ne PAS déclencher de refresh silencieux si l'erreur 401 est liée à :
      // - Une erreur de mot de passe actuel / incorrect (validation lors d'une action sensible).
      // - Des identifiants invalides ou un jeton temporaire 2FA non finalisé.
      // À l'inverse, l'absence ou l'expiration du jeton d'accès (ex: "Jeton d’authentification manquant")
      // DOIT déclencher le refresh silencieux via le refresh_token HTTP-only.
      let isUnrefreshable = false;
      try {
        const cloned = response.clone();
        const body = await cloned.json();
        const rawMessage = body?.message || body?.error || '';
        const messageStr = (
          Array.isArray(rawMessage) ? rawMessage.join(' ') : String(rawMessage)
        ).toLowerCase();

        isUnrefreshable =
          messageStr.includes('mot de passe actuel') ||
          messageStr.includes('mot de passe incorrect') ||
          messageStr.includes('identifiants invalides') ||
          messageStr.includes('temporaire');
      } catch {
        // Ignorer l'échec de lecture JSON du clone
      }

      if (!isUnrefreshable) {
        const refreshed = await this.refreshToken();

        if (refreshed) {
          // Renouvellement réussi : rejouer la requête une seule fois
          // Récupérer le nouveau jeton CSRF si mis à jour
          if (isMutation) {
            const freshCsrfToken = this._csrfToken || getCookie('csrf_token');
            if (freshCsrfToken) {
              headers.set('x-csrf-token', freshCsrfToken);
            }
          }

          response = await fetch(url, {
            ...requestConfig,
            headers,
          });

          // Si la requête rejouée après refresh échoue avec 403 (CSRF), resynchroniser le CSRF et réessayer
          if (isMutation && response.status === 403) {
            const freshCsrf = await this.initCsrf(true);
            if (freshCsrf) {
              headers.set('x-csrf-token', freshCsrf);
              response = await fetch(url, {
                ...requestConfig,
                headers,
              });
            }
          }
        }
      }
    }

    return response;
  },

  /**
   * Déconnexion sécurisée de la session courante auprès du backend NestJS (POST /auth/logout).
   * Initialise le cookie CSRF si nécessaire et injecte x-csrf-token.
   * Transmet les cookies HTTP-only via credentials: 'include'.
   * Le backend révoque la session serveur et efface les cookies.
   */
  async logout(): Promise<void> {
    let csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
      await this.initCsrf();
      csrfToken = getCookie('csrf_token');
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      this.clearSessionCache();
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Échec de la déconnexion (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    this.clearSessionCache();
  },

  /**
   * Déconnexion sécurisée de tous les appareils auprès du backend NestJS (POST /auth/logout-all).
   * Initialise le cookie CSRF si nécessaire et injecte x-csrf-token.
   * Transmet les cookies HTTP-only via credentials: 'include'.
   * Le backend révoque toutes les sessions en incrémentant tokenVersion et efface les cookies.
   */
  async logoutAll(): Promise<void> {
    let csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
      await this.initCsrf();
      csrfToken = getCookie('csrf_token');
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/logout-all`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      this.clearSessionCache();
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Échec de la déconnexion globale (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    this.clearSessionCache();
  },

  /**
   * Demande de réinitialisation de mot de passe (POST /auth/forgot-password).
   * Génère et expédie un code OTP à 6 chiffres par e-mail si le compte existe.
   * Transmet les cookies (credentials: 'include') et le jeton CSRF.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    let csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
      await this.initCsrf();
      csrfToken = getCookie('csrf_token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la demande de réinitialisation (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return data;
  },

  /**
   * Vérification et consommation du code OTP de récupération de mot de passe (POST /auth/verify-reset-code).
   * Valide le code à 6 chiffres, émet le cookie HTTP-only password_reset_token (10 minutes) et actualise le cookie CSRF.
   */
  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<{ message: string; resetToken?: string; expiresIn?: number }> {
    let csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
      await this.initCsrf();
      csrfToken = getCookie('csrf_token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/verify-reset-code`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la vérification du code (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return data;
  },

  /**
   * Réinitialisation effective du mot de passe avec preuve temporaire valide (POST /auth/reset-password).
   * La preuve temporaire est transmise de manière privilégiée via le cookie HTTP-only password_reset_token.
   * Transmet les cookies (credentials: 'include') et le jeton CSRF.
   */
  async resetPassword(payload: {
    password: string;
    password_confirmation: string;
    resetToken?: string;
  }): Promise<{ message: string }> {
    let csrfToken = getCookie('csrf_token');
    if (!csrfToken) {
      await this.initCsrf();
      csrfToken = getCookie('csrf_token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la réinitialisation du mot de passe (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    // Nettoyage de l'adresse email temporaire après réinitialisation réussie
    this.clearResetPasswordEmail();

    return data;
  },

  /**
   * Consultation du nombre de codes de récupération 2FA restants (GET /auth/admin/2fa/recovery).
   * Retourne le décompte sans exposer les codes.
   */
  async getTwoFactorRecoveryCount(): Promise<{ remaining_count: number } | null> {
    try {
      const res = await this.requestWithAuth(
        `${this.apiBaseUrl}/auth/admin/2fa/recovery`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
      );

      if (!res.ok) {
        return null;
      }

      const data = await res.json().catch(() => null);
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Mise à jour du profil de l'utilisateur connecté (PATCH /users/me).
   *
   * Si une photo est fournie, la requête est encodée en multipart/form-data.
   * Sinon, elle est envoyée en JSON.
   *
   * Champs supportés par le backend :
   * - nom, prenom             → informations personnelles
   * - current_password,
   *   password,
   *   password_confirmation   → changement de mot de passe (tous obligatoires ensemble)
   * - photo (File)            → photo de profil (multipart uniquement)
   *
   * La réponse contient :
   * - message           : confirmation textuelle
   * - password_changed  : true si le mot de passe a été modifié
   *                       (les cookies sont effacés côté backend → reconnecter l'utilisateur)
   * - user              : profil sérialisé sans données sensibles
   */
  async updateProfile(payload: {
    nom?: string;
    prenom?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
    photo?: File | null;
  }): Promise<{
    message: string;
    password_changed: boolean;
    user: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
      role: string;
      statut_compte: string;
      is_verified: boolean;
      profile_photo_url?: string | null;
      created_at: string;
    };
  }> {
    const { photo, ...fields } = payload;
    const hasPhoto = photo instanceof File;

    let body: BodyInit;
    const extraHeaders: Record<string, string> = {};

    if (hasPhoto) {
      // Multipart/form-data : champs texte + fichier photo
      const form = new FormData();
      if (fields.nom) form.append('nom', fields.nom);
      if (fields.prenom) form.append('prenom', fields.prenom);
      if (fields.current_password) form.append('current_password', fields.current_password);
      if (fields.password) form.append('password', fields.password);
      if (fields.password_confirmation) form.append('password_confirmation', fields.password_confirmation);
      form.append('photo', photo);
      body = form;
      // Ne pas poser Content-Type manuellement : le browser le fait avec le boundary correct
    } else {
      // JSON : uniquement les champs texte
      const jsonPayload: Record<string, string> = {};
      if (fields.nom) jsonPayload.nom = fields.nom;
      if (fields.prenom) jsonPayload.prenom = fields.prenom;
      if (fields.current_password) jsonPayload.current_password = fields.current_password;
      if (fields.password) jsonPayload.password = fields.password;
      if (fields.password_confirmation) jsonPayload.password_confirmation = fields.password_confirmation;
      body = JSON.stringify(jsonPayload);
      extraHeaders['Content-Type'] = 'application/json';
    }

    const res = await this.requestWithAuth(`${this.apiBaseUrl}/users/me`, {
      method: 'PATCH',
      headers: { Accept: 'application/json', ...extraHeaders },
      body,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la mise à jour du profil (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    // Mettre à jour le cache de session si les données utilisateur ont changé
    if (data?.user) {
      this.setSessionUser(data.user);
    }

    return data;
  },

  /**
   * Régénération des 8 codes de récupération 2FA de l'administrateur (POST /auth/admin/2fa/recovery/regenerate).
   * Invalide immédiatement les anciens codes et retourne 8 nouveaux codes en clair après confirmation du mot de passe.
   */
  async regenerateRecoveryCodes(password: string): Promise<{
    message: string;
    recovery_codes: string[];
  }> {
    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/auth/admin/2fa/recovery/regenerate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ password }),
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la régénération des codes (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    return data;
  },

  /**
   * Réinitialisation de la configuration 2FA de l'administrateur (POST /auth/admin/2fa/reset).
   * Supprime le secret TOTP, invalide tous les codes de secours, révoque tous les refresh tokens
   * et efface les cookies de session.
   */
  async resetTwoFactor(password: string): Promise<{
    message: string;
  }> {
    const res = await this.requestWithAuth(
      `${this.apiBaseUrl}/auth/admin/2fa/reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ password }),
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la réinitialisation du 2FA (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      throw new Error(formattedMessage);
    }

    this.clearSessionCache();

    return data;
  },

  /**
   * Récupère la liste paginée des permissions pour le Super Administrateur (GET /super-admin/permissions).
   * Accepte page, limit, search, et module.
   */
  async getPermissions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    module?: string;
  }): Promise<PaginatedPermissionsResult> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.module && params.module.trim() && params.module !== 'all') {
      query.set('module', params.module.trim());
    }

    const queryString = query.toString();
    const url = `${this.apiBaseUrl}/super-admin/permissions${queryString ? `?${queryString}` : ''}`;
    const res = await this.requestWithAuth(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        (res.status === 403
          ? 'Cette opération est strictement réservée au Super Administrateur.'
          : res.status === 401
          ? 'Session expirée ou utilisateur non authentifié.'
          : `Erreur lors de la récupération des permissions (${res.status})`);
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return data;
  },

  /**
   * Récupère la liste de tous les rôles avec leurs permissions (GET /roles).
   */
  async getRoles(): Promise<RoleItem[]> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/roles`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la récupération des rôles (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return (data?.data || []) as RoleItem[];
  },

  /**
   * Consulte les détails d'un rôle spécifique (GET /roles/:id).
   */
  async getRole(id: string): Promise<RoleItem> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/roles/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Rôle introuvable (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return (data?.data || data) as RoleItem;
  },

  /**
   * Crée un rôle avec ses permissions associées (POST /roles).
   */
  async createRole(payload: CreateRolePayload): Promise<RoleItem> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la création du rôle (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return (data?.data || data) as RoleItem;
  },

  /**
   * Modifie un rôle et resynchronise ses permissions (PATCH /roles/:id).
   */
  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/roles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la mise à jour du rôle (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return (data?.data || data) as RoleItem;
  },

  /**
   * Supprime un rôle (DELETE /roles/:id).
   */
  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.requestWithAuth(`${this.apiBaseUrl}/roles/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Erreur lors de la suppression du rôle (${res.status})`;
      const formattedMessage = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage;
      const error: any = new Error(formattedMessage);
      error.status = res.status;
      throw error;
    }

    return data || { success: true, message: 'Rôle supprimé avec succès.' };
  },
};



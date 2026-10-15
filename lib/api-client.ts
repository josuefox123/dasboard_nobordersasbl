import {
  Product,
  Order,
  Customer,
  Donation,
  ContentItem,
  DashboardUser,
  SettingsState,
  OverviewMetrics,
  PaymentStatus,
  ShippingStatus,
} from '@/types/dashboard';

import {
  initialProducts,
  initialOrders,
  initialCustomers,
  initialDonations,
  initialContents,
  initialUsers,
  initialSettings,
  overviewMetricsData,
} from '@/lib/mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

// Helper to access localStorage safely on the client
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(`nb_admin_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`nb_admin_${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn('Storage write failed', error);
  }
}

/**
 * Service API pour No Borders ASBL
 * Supporte automatiquement le mode réel (API Laravel avec Bearer token)
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

  // PRODUITS
  async getProducts(): Promise<Product[]> {
    if (this.isDemoMode) {
      return getStorageItem<Product[]>('products', initialProducts);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getStorageItem<Product[]>('products', initialProducts);
    }
  },

  async saveProduct(product: Partial<Product> & { name: string; price: number; category: any }): Promise<Product> {
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
        id: `prod-${Date.now()}`,
        name: product.name,
        sku: product.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        category: product.category,
        categoryLabel:
          product.category === 'bamboo-bikes'
            ? 'Vélos en Bambou'
            : product.category === 'hase-bikes'
            ? 'Hase Bikes'
            : product.category === 'elliptigo'
            ? 'ElliptiGO'
            : 'Accessoires',
        price: Number(product.price),
        stock: Number(product.stock || 0),
        status: (product.stock || 0) <= 0 ? 'out_of_stock' : (product.stock || 0) < 3 ? 'low_stock' : 'in_stock',
        description: product.description || '',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      products.unshift(updated);
    }

    setStorageItem('products', products);
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    const products = getStorageItem<Product[]>('products', initialProducts);
    const filtered = products.filter((p) => p.id !== id);
    setStorageItem('products', filtered);
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

  // CONTENUS DU SITE
  async getContents(): Promise<ContentItem[]> {
    return getStorageItem<ContentItem[]>('contents', initialContents);
  },

  async saveContent(content: Partial<ContentItem> & { title: string; type: any; locale: any }): Promise<ContentItem> {
    const contents = getStorageItem<ContentItem[]>('contents', initialContents);
    let item: ContentItem;

    if (content.id) {
      const idx = contents.findIndex((c) => c.id === content.id);
      if (idx !== -1) {
        item = { ...contents[idx], ...content, updatedAt: new Date().toISOString().slice(0, 10) } as ContentItem;
        contents[idx] = item;
      } else {
        item = content as ContentItem;
      }
    } else {
      item = {
        id: `cnt-${Date.now()}`,
        title: content.title,
        slug: content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        type: content.type,
        locale: content.locale,
        status: content.status || 'draft',
        author: 'Équipe No Borders',
        updatedAt: new Date().toISOString().slice(0, 10),
        publishedAt: content.status === 'published' ? new Date().toISOString().slice(0, 10) : undefined,
        viewsCount: 0,
        image: content.image,
        images: content.images || [],
        content: content.content || '',
      };
      contents.unshift(item);
    }
    setStorageItem('contents', contents);
    return item;
  },

  async deleteContent(id: string): Promise<void> {
    const contents = getStorageItem<ContentItem[]>('contents', initialContents);
    setStorageItem('contents', contents.filter((c) => c.id !== id));
  },

  // UTILISATEURS & PERMISSIONS
  async getUsers(): Promise<DashboardUser[]> {
    return getStorageItem<DashboardUser[]>('users', initialUsers);
  },

  async updateUserRole(id: string, role: DashboardUser['role'], status: DashboardUser['status']): Promise<DashboardUser | null> {
    const users = getStorageItem<DashboardUser[]>('users', initialUsers);
    const user = users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      user.status = status;
      user.roleLabel =
        role === 'super_admin'
          ? 'Super Administrateur'
          : role === 'manager'
          ? 'Gestionnaire Boutique & Stocks'
          : role === 'treasurer'
          ? 'Trésorier & Dons'
          : 'Rédacteur Web & Événements';
      setStorageItem('users', users);
      return user;
    }
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
};

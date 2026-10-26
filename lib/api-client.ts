import {
  Product,
  Order,
  Customer,
  Donation,
  ContentItem,
  ContactMessage,
  FaqItem,
  ActivityItem,
  NewsItem,
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
  initialNews,
  initialPressItems,
  initialPartners,
  initialCategories,
  initialParcours,
  initialPayments,
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
        video: content.video || '',
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

  // MESSAGES DE CONTACT
  async getContactMessages(): Promise<ContactMessage[]> {
    return getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
  },

  async markContactMessageAsRead(id: string): Promise<ContactMessage | null> {
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
  },

  async deleteContactMessage(id: string): Promise<void> {
    const messages = getStorageItem<ContactMessage[]>('contact_messages', initialContactMessages);
    setStorageItem('contact_messages', messages.filter((m) => m.id !== id));
  },

  // FAQ
  async getFaqs(): Promise<FaqItem[]> {
    return getStorageItem<FaqItem[]>('faqs', initialFaqs);
  },

  async saveFaq(faq: Partial<FaqItem> & { question: string; answer: string }): Promise<FaqItem> {
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
        status: faq.status || 'active',
        category: faq.category || 'Général',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      faqs.unshift(item);
    }
    setStorageItem('faqs', faqs);
    return item;
  },

  async toggleFaqStatus(id: string): Promise<FaqItem | null> {
    const faqs = getStorageItem<FaqItem[]>('faqs', initialFaqs);
    const faq = faqs.find((f) => f.id === id);
    if (faq) {
      faq.status = faq.status === 'active' ? 'inactive' : 'active';
      faq.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('faqs', faqs);
      return faq;
    }
    return null;
  },

  async deleteFaq(id: string): Promise<void> {
    const faqs = getStorageItem<FaqItem[]>('faqs', initialFaqs);
    setStorageItem('faqs', faqs.filter((f) => f.id !== id));
  },

  // ACTIVITÉS
  async getActivities(): Promise<ActivityItem[]> {
    return getStorageItem<ActivityItem[]>('activities', initialActivities);
  },

  async saveActivity(activity: Partial<ActivityItem> & { title: string; description: string }): Promise<ActivityItem> {
    const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
    let item: ActivityItem;

    const images = activity.images && activity.images.length > 0
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
        category: activity.category || 'Ateliers & Événements',
        description: activity.description.trim(),
        status: activity.status || 'active',
        image: images[0] || '',
        images,
        date: activity.date || 'Toute l’année',
        location: activity.location || 'Bruxelles',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      activities.unshift(item);
    }
    setStorageItem('activities', activities);
    return item;
  },

  async toggleActivityStatus(id: string): Promise<ActivityItem | null> {
    const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
    const activity = activities.find((a) => a.id === id);
    if (activity) {
      activity.status = activity.status === 'active' ? 'inactive' : 'active';
      activity.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('activities', activities);
      return activity;
    }
    return null;
  },

  async deleteActivity(id: string): Promise<void> {
    const activities = getStorageItem<ActivityItem[]>('activities', initialActivities);
    setStorageItem('activities', activities.filter((a) => a.id !== id));
  },

  // ACTUALITÉS
  async getNews(): Promise<NewsItem[]> {
    return getStorageItem<NewsItem[]>('news', initialNews);
  },

  async saveNews(newsItem: Partial<NewsItem> & { title: string; category: string; description: string }): Promise<NewsItem> {
    const allNews = getStorageItem<NewsItem[]>('news', initialNews);
    let item: NewsItem;

    const images = newsItem.images && newsItem.images.length > 0
      ? newsItem.images
      : newsItem.image
      ? [newsItem.image]
      : [];

    if (newsItem.id) {
      const idx = allNews.findIndex((n) => n.id === newsItem.id);
      if (idx !== -1) {
        item = {
          ...allNews[idx],
          ...newsItem,
          image: images[0] || '',
          images,
          updatedAt: new Date().toISOString().slice(0, 10),
        } as NewsItem;
        allNews[idx] = item;
      } else {
        item = newsItem as NewsItem;
      }
    } else {
      item = {
        id: `news-${Date.now()}`,
        title: newsItem.title.trim(),
        category: newsItem.category || 'Vie de l’ASBL',
        description: newsItem.description.trim(),
        status: newsItem.status || 'active',
        image: images[0] || '',
        images,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      allNews.unshift(item);
    }
    setStorageItem('news', allNews);
    return item;
  },

  async toggleNewsStatus(id: string): Promise<NewsItem | null> {
    const allNews = getStorageItem<NewsItem[]>('news', initialNews);
    const item = allNews.find((n) => n.id === id);
    if (item) {
      item.status = item.status === 'active' ? 'inactive' : 'active';
      item.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('news', allNews);
      return item;
    }
    return null;
  },

  async deleteNews(id: string): Promise<void> {
    const allNews = getStorageItem<NewsItem[]>('news', initialNews);
    setStorageItem('news', allNews.filter((n) => n.id !== id));
  },

  // PRESSE
  async getPressItems(): Promise<PressItem[]> {
    return getStorageItem<PressItem[]>('press_items', initialPressItems);
  },

  async savePressItem(pressItem: Partial<PressItem> & { title: string }): Promise<PressItem> {
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
  },

  async togglePressItemStatus(id: string): Promise<PressItem | null> {
    const allPress = getStorageItem<PressItem[]>('press_items', initialPressItems);
    const item = allPress.find((p) => p.id === id);
    if (item) {
      item.status = item.status === 'active' ? 'inactive' : 'active';
      item.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('press_items', allPress);
      return item;
    }
    return null;
  },

  async deletePressItem(id: string): Promise<void> {
    const allPress = getStorageItem<PressItem[]>('press_items', initialPressItems);
    setStorageItem('press_items', allPress.filter((p) => p.id !== id));
  },

  // PARTENAIRES
  async getPartners(): Promise<PartnerItem[]> {
    return getStorageItem<PartnerItem[]>('partners', initialPartners);
  },

  async savePartner(partnerData: Partial<PartnerItem> & { name: string }): Promise<PartnerItem> {
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
        status: partnerData.status || 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      allPartners.unshift(item);
    }
    setStorageItem('partners', allPartners);
    return item;
  },

  async togglePartnerStatus(id: string): Promise<PartnerItem | null> {
    const allPartners = getStorageItem<PartnerItem[]>('partners', initialPartners);
    const item = allPartners.find((p) => p.id === id);
    if (item) {
      item.status = item.status === 'active' ? 'inactive' : 'active';
      item.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('partners', allPartners);
      return item;
    }
    return null;
  },

  async deletePartner(id: string): Promise<void> {
    const allPartners = getStorageItem<PartnerItem[]>('partners', initialPartners);
    setStorageItem('partners', allPartners.filter((p) => p.id !== id));
  },

  // CATÉGORIES DE PRODUITS
  async getCategories(): Promise<CategoryItem[]> {
    return getStorageItem<CategoryItem[]>('product_categories', initialCategories);
  },

  async saveCategory(categoryData: Partial<CategoryItem> & { title: string }): Promise<CategoryItem> {
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
  },

  async toggleCategoryStatus(id: string): Promise<CategoryItem | null> {
    const allCategories = getStorageItem<CategoryItem[]>('product_categories', initialCategories);
    const item = allCategories.find((c) => c.id === id);
    if (item) {
      item.status = item.status === 'active' ? 'inactive' : 'active';
      item.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('product_categories', allCategories);
      return item;
    }
    return null;
  },

  async deleteCategory(id: string): Promise<void> {
    const allCategories = getStorageItem<CategoryItem[]>('product_categories', initialCategories);
    setStorageItem('product_categories', allCategories.filter((c) => c.id !== id));
  },

  // PARCOURS
  async getParcours(): Promise<ParcoursItem[]> {
    return getStorageItem<ParcoursItem[]>('parcours', initialParcours);
  },

  async saveParcours(parcoursData: Partial<ParcoursItem> & { title: string }): Promise<ParcoursItem> {
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
        status: parcoursData.status || 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      allParcours.unshift(item);
    }
    setStorageItem('parcours', allParcours);
    return item;
  },

  async toggleParcoursStatus(id: string): Promise<ParcoursItem | null> {
    const allParcours = getStorageItem<ParcoursItem[]>('parcours', initialParcours);
    const item = allParcours.find((p) => p.id === id);
    if (item) {
      item.status = item.status === 'active' ? 'inactive' : 'active';
      item.updatedAt = new Date().toISOString().slice(0, 10);
      setStorageItem('parcours', allParcours);
      return item;
    }
    return null;
  },

  async deleteParcours(id: string): Promise<void> {
    const allParcours = getStorageItem<ParcoursItem[]>('parcours', initialParcours);
    setStorageItem('parcours', allParcours.filter((p) => p.id !== id));
  },

  // PAIEMENTS (CONSULTATION SEULE)
  async getPayments(): Promise<PaymentRecord[]> {
    return getStorageItem<PaymentRecord[]>('payments_records', initialPayments);
  },

  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    const allPayments = getStorageItem<PaymentRecord[]>('payments_records', initialPayments);
    return allPayments.find((p) => p.id === id || p.reference === id) || null;
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

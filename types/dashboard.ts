export type ProductCategory = 'bamboo-bikes' | 'hase-bikes' | 'elliptigo' | 'accessories';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  isFeatured?: boolean;
  image?: string;
  images?: string[];
  description: string;
  createdAt: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type ShippingStatus = 'delivered' | 'in_transit' | 'pending' | 'ready_for_pickup';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingMethod: 'bpost_delivery' | 'workshop_pickup' | 'express';
  items: OrderItem[];
  refundReason?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  lastOrderDate: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  reference: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  project: string;
  taxReceiptRequested: boolean;
  taxReceiptSent: boolean;
  status: 'completed' | 'pending';
  paymentMethod: 'bancontact' | 'stripe' | 'bank_transfer';
  createdAt: string;
}

export type ContentType = 'article' | 'event' | 'page' | 'announcement';

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  locale: 'fr' | 'nl' | 'en';
  status: 'published' | 'draft' | 'archived';
  author: string;
  updatedAt: string;
  publishedAt?: string;
  viewsCount: number;
  image?: string;
  images?: string[];
  content?: string;
}

export type UserRole = 'super_admin' | 'manager' | 'editor' | 'treasurer';

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  status: 'active' | 'suspended';
  permissions: string[];
  lastLogin?: string;
  avatar?: string;
}

export interface WebsiteSettings {
  tagline: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  aboutTitle: string;
  aboutText: string;
  announcementBarText: string;
  announcementBarEnabled: boolean;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  footerText: string;
}

export interface SettingsState {
  general: {
    siteName: string;
    contactEmail: string;
    phone: string;
    address: string;
    defaultLocale: 'fr' | 'nl' | 'en';
    activeLocales: ('fr' | 'nl' | 'en')[];
  };
  website: WebsiteSettings;
  shipping: {
    enableBpost: boolean;
    bpostStandardRate: number;
    enableWorkshopPickup: boolean;
    pickupInstructions: string;
    freeShippingThreshold: number;
  };
  payments: {
    enableStripe: boolean;
    enableMollieBancontact: boolean;
    enableBankTransfer: boolean;
    iban: string;
    bic: string;
    testMode: boolean;
  };
  notifications: {
    notifyAdminNewOrder: boolean;
    notifyAdminNewDonation: boolean;
    notifyLowStockThreshold: number;
    adminNotificationEmail: string;
  };
}

export interface OverviewMetrics {
  totalSales: number;
  salesGrowthPercent: number;
  totalOrders: number;
  ordersGrowthPercent: number;
  totalDonations: number;
  donationsGrowthPercent: number;
  activeCustomers: number;
  lowStockCount: number;
  recentSalesData: { month: string; sales: number; donations: number }[];
}

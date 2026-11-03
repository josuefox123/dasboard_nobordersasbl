export type ProductCategory =
  | 'bamboo-bikes'
  | 'hase-bikes'
  | 'elliptigo'
  | 'accessories'
  | (string & {});

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId?: string | null;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  statut?: 'active' | 'inactive';
  isFeatured?: boolean;
  image?: string;
  images?: string[];
  description: string;
  createdAt: string;
  updatedAt?: string;
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
  video?: string;
  content?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  status: 'active' | 'inactive';
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  image?: string;
  images?: string[];
  date?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PressItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
  status: 'active' | 'inactive';
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PartnerItem {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface ParcoursItem {
  id: string;
  title: string;
  description: string;
  period: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  customerName: string;
  customerEmail?: string;
  service: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: 'bancontact' | 'stripe' | 'bank_transfer';
  paymentDate: string;
  transactionId?: string;
  orderNumber?: string;
  createdAt: string;
}

export type UserRole = 'super_admin' | 'manager' | 'editor' | 'treasurer' | string;

export interface DashboardUser {
  id: string;
  nom?: string;
  prenom?: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  status: 'active' | 'suspended' | 'pending_activation' | 'pending_verification' | string;
  permissions: string[];
  lastLogin?: string;
  avatar?: string;
  activeRole?: {
    id: string;
    name: string;
    label: string;
  } | null;
  invitation?: {
    id: string;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminPayload {
  nom: string;
  prenom: string;
  email: string;
  role_id: string;
}

export interface ResendInvitationPayload {
  email?: string;
  userId?: string;
  invitationId?: string;
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

export interface PermissionItem {
  id: string;
  name: string;
  module: string;
  label: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPermissionsResult {
  success: boolean;
  message: string;
  data: PermissionItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  modules?: string[];
}

export interface RoleItem {
  id: string;
  name: string;
  label: string;
  description: string | null;
  is_system: boolean;
  is_active?: boolean;
  isActive?: boolean;
  created_at: string;
  updated_at: string;
  permissions_count: number;
  permissions: PermissionItem[];
}

export interface CreateRolePayload {
  name: string;
  label: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  label?: string;
  description?: string;
  permissions?: string[];
}



import { pgTable, text, varchar, integer, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// 1. Merchants & Stores Table (Shared across 1group)
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  numericId: varchar('numeric_id', { length: 12 }).notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  location: text('location').notNull(),
  handle: varchar('handle', { length: 50 }),
  bcvRate: numeric('bcv_rate', { precision: 12, scale: 2 }).notNull(),
  ownerPassword: text('owner_password').notNull(),
  webhookSecret: text('webhook_secret'),
  remoteTimeoutSec: integer('remote_timeout_sec').notNull().default(30),
  remoteCooldownSec: integer('remote_cooldown_sec').notNull().default(60),
  pagoMovilConfig: jsonb('pago_movil_config').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Customer Wallets & Tabs Table
export const customerWallets = pgTable('customer_wallets', {
  id: text('id').primaryKey(),
  storeSlug: text('store_slug').notNull(),
  cedula: varchar('cedula', { length: 20 }).notNull(),
  tabId: varchar('tab_id', { length: 35 }).notNull().unique(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull(),
  customerName: text('customer_name').notNull(),
  pin: varchar('pin', { length: 10 }).notNull(),
  balanceUsd: numeric('balance_usd', { precision: 12, scale: 2 }).notNull().default('0.00'),
  balanceVes: numeric('balance_ves', { precision: 14, scale: 2 }).notNull().default('0.00'),
  creditLimitUsd: numeric('credit_limit_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
  allowRemoteCharge: boolean('allow_remote_charge').notNull().default(true),
  lastRemoteChargeAt: timestamp('last_remote_charge_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_wallet_cedula_store').on(table.storeSlug, table.cedula),
  index('idx_wallet_phone_store').on(table.storeSlug, table.customerPhone),
]);

// 3. POS Terminals Table
export const posTerminals = pgTable('pos_terminals', {
  id: text('id').primaryKey(),
  storeSlug: text('store_slug').notNull(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  accessCode: varchar('access_code', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  totalOrdersCount: integer('total_orders_count').notNull().default(0),
  totalSalesUsd: numeric('total_sales_usd', { precision: 12, scale: 2 }).notNull().default('0.00'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Invoices Table
export const barInvoices = pgTable('bar_invoices', {
  id: text('id').primaryKey(),
  storeSlug: text('store_slug').notNull(),
  channel: varchar('channel', { length: 25 }).notNull().default('present_qr'),
  targetCedula: varchar('target_cedula', { length: 20 }),
  targetWalletId: text('target_wallet_id'),
  posId: text('pos_id'),
  posName: text('pos_name'),
  totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
  totalVes: numeric('total_ves', { precision: 12, scale: 2 }).notNull(),
  items: jsonb('items').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paidByWalletId: text('paid_by_wallet_id'),
  paidByCustomerName: text('paid_by_customer_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_invoice_store_status').on(table.storeSlug, table.status),
  index('idx_invoice_target_wallet').on(table.targetWalletId, table.status),
]);

// 5. Immutable Ledger Transactions Table
export const ledgerTransactions = pgTable('ledger_transactions', {
  id: text('id').primaryKey(),
  storeSlug: text('store_slug').notNull(),
  walletId: text('wallet_id').notNull(),
  tabCedula: varchar('tab_cedula', { length: 20 }),
  depositorCedula: varchar('depositor_cedula', { length: 20 }),
  channel: varchar('channel', { length: 25 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull(),
  amountVes: numeric('amount_ves', { precision: 12, scale: 2 }).notNull(),
  settledBcvRate: numeric('settled_bcv_rate', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  reference: text('reference'),
  bankName: text('bank_name'),
  posId: text('pos_id'),
  posName: text('pos_name'),
  items: jsonb('items'),
  invoiceId: text('invoice_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_ledger_wallet').on(table.walletId, table.createdAt),
  index('idx_ledger_store').on(table.storeSlug, table.createdAt),
  index('idx_ledger_reference').on(table.reference),
]);

// 6. Ingested Bank Payments (1pay Webhook Integration)
export const bankPayments = pgTable('bank_payments', {
  id: text('id').primaryKey(),
  reference: varchar('reference', { length: 60 }).notNull().unique(),
  storeSlug: text('store_slug').notNull(),
  amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull(),
  amountVes: numeric('amount_ves', { precision: 12, scale: 2 }).notNull(),
  settledBcvRate: numeric('settled_bcv_rate', { precision: 12, scale: 2 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }),
  depositorCedula: varchar('depositor_cedula', { length: 20 }),
  bankName: text('bank_name').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('unclaimed'),
  claimedWalletId: text('claimed_wallet_id'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_bank_reference').on(table.reference),
  index('idx_bank_store_status').on(table.storeSlug, table.status),
]);

// 7. 1commerce Product Catalog (Hero SKUs & Inventory)
export const commerceProducts = pgTable('commerce_products', {
  id: text('id').primaryKey(),
  storeSlug: text('store_slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priceUsd: numeric('price_usd', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  imageEmoji: varchar('image_emoji', { length: 10 }).default('📦'),
  inStock: boolean('in_stock').notNull().default(true),
  stockQuantity: integer('stock_quantity').notNull().default(10),
  soldQuantity: integer('sold_quantity').notNull().default(0),
  leadTimeText: text('lead_time_text'),
  partNumber: text('part_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_product_store').on(table.storeSlug, table.category),
]);

// 8. 1commerce Customer Orders & Fulfillment
export const commerceOrders = pgTable('commerce_orders', {
  id: text('id').primaryKey(),
  storeSlug: text('store_slug').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryZone: text('delivery_zone').notNull(),
  deliveryNotes: text('delivery_notes'),
  items: jsonb('items').notNull(),
  totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
  totalVes: numeric('total_ves', { precision: 12, scale: 2 }).notNull(),
  bcvRate: numeric('bcv_rate', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull(),
  paymentReference: varchar('payment_reference', { length: 60 }),
  paymentVerifiedBy1Pay: boolean('payment_verified_by_1pay').notNull().default(false),
  paymentBank: text('payment_bank'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_orders_store_status').on(table.storeSlug, table.status),
  index('idx_orders_reference').on(table.paymentReference),
]);

// 9. 1service Workshop Job Orders (Service Work Orders)
export const serviceJobOrders = pgTable('service_job_orders', {
  id: text('id').primaryKey(),
  workshopSlug: text('workshop_slug').notNull(),
  customerCedula: varchar('customer_cedula', { length: 20 }).notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull(),
  vehiclePlate: varchar('vehicle_plate', { length: 20 }).notNull(),
  vehicleModel: text('vehicle_model').notNull(),
  currentMileage: integer('current_mileage').notNull().default(0),
  reportedIssue: text('reported_issue').notNull(),
  diagnosticNotes: text('diagnostic_notes'),
  status: varchar('status', { length: 30 }).notNull().default('intake'), // 'intake', 'diagnosing', 'quoted', 'approved', 'in_progress', 'ready', 'delivered', 'cancelled'
  items: jsonb('items').notNull(),
  totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
  totalVes: numeric('total_ves', { precision: 12, scale: 2 }).notNull(),
  bcvRate: numeric('bcv_rate', { precision: 12, scale: 2 }).notNull(),
  depositRequiredUsd: numeric('deposit_required_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
  depositPaidUsd: numeric('deposit_paid_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
  paymentStatus: varchar('payment_status', { length: 30 }).notNull().default('unpaid'), // 'unpaid', 'deposit_paid', 'fully_paid'
  paymentMethod: varchar('payment_method', { length: 30 }),
  paymentReference: varchar('payment_reference', { length: 60 }),
  warrantyDays: integer('warranty_days').notNull().default(30),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  readyAt: timestamp('ready_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_job_workshop_status').on(table.workshopSlug, table.status),
  index('idx_job_vehicle_plate').on(table.vehiclePlate),
  index('idx_job_customer_cedula').on(table.customerCedula),
]);

// 10. 1service Vehicle Service Passports (Digital Maintenance Log)
export const vehicleServicePassports = pgTable('vehicle_service_passports', {
  id: text('id').primaryKey(),
  vehiclePlate: varchar('vehicle_plate', { length: 20 }).notNull().unique(),
  vehicleModel: text('vehicle_model').notNull(),
  ownerCedula: varchar('owner_cedula', { length: 20 }).notNull(),
  currentMileage: integer('current_mileage').notNull().default(0),
  serviceHistory: jsonb('service_history').notNull(),
  nextServiceMileage: integer('next_service_mileage'),
  nextServiceDate: timestamp('next_service_date', { withTimezone: true }),
  nextServiceDescription: text('next_service_description'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_passport_plate').on(table.vehiclePlate),
  index('idx_passport_owner').on(table.ownerCedula),
]);

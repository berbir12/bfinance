import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(), nameAm: text('name_am').notNull(), nameEn: text('name_en').notNull(), type: text('type').notNull(),
});
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }), businessId: text('business_id').notNull().references(() => businesses.id), type: text('type').notNull(), category: text('category').notNull(), amount: real('amount').notNull(), date: text('date').notNull(), party: text('party'), description: text('description').notNull(), paymentMethod: text('payment_method').notNull().default('cash'), notes: text('notes'), deletedAt: text('deleted_at'), createdAt: text('created_at').notNull(),
});
export const inventoryItems = sqliteTable('inventory_items', {
  id: integer('id').primaryKey({ autoIncrement: true }), businessId: text('business_id').notNull().references(() => businesses.id), name: text('name').notNull(), category: text('category').notNull(), brand: text('brand'), quantity: real('quantity').notNull(), unit: text('unit').notNull(), purchasePrice: real('purchase_price').notNull(), sellingPrice: real('selling_price'), minimumStock: real('minimum_stock').notNull().default(0), supplier: text('supplier'), location: text('location'), expirationDate: text('expiration_date'), deletedAt: text('deleted_at'),
});
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }), itemId: integer('item_id').notNull().references(() => inventoryItems.id), businessId: text('business_id').notNull().references(() => businesses.id), movementType: text('movement_type').notNull(), reason: text('reason').notNull(), quantity: real('quantity').notNull(), date: text('date').notNull(), notes: text('notes'), createdAt: text('created_at').notNull(),
});
export const parties = sqliteTable('parties', {
  id: integer('id').primaryKey({ autoIncrement: true }), businessId: text('business_id').notNull().references(() => businesses.id), type: text('type').notNull(), name: text('name').notNull(), phone: text('phone'), location: text('location'), total: real('total').notNull().default(0), paid: real('paid').notNull().default(0), dueDate: text('due_date'), notes: text('notes'), deletedAt: text('deleted_at'),
});
export const crops = sqliteTable('crops', {
  id: integer('id').primaryKey({ autoIncrement: true }), businessId: text('business_id').notNull().references(() => businesses.id), name: text('name').notNull(), field: text('field').notNull(), plantingDate: text('planting_date').notNull(), harvestDate: text('harvest_date').notNull(), area: real('area').notNull(), expectedYield: real('expected_yield').notNull(), actualYield: real('actual_yield').notNull().default(0), status: text('status').notNull(),
});
export const farmActivities = sqliteTable('farm_activities', {
  id: integer('id').primaryKey({ autoIncrement: true }), cropId: integer('crop_id').references(() => crops.id), type: text('type').notNull(), date: text('date').notNull(), cost: real('cost').notNull(), notes: text('notes'),
});
export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }), businessId: text('business_id').references(() => businesses.id), severity: text('severity').notNull(), titleAm: text('title_am').notNull(), titleEn: text('title_en').notNull(), createdAt: text('created_at').notNull(), readAt: text('read_at'),
});

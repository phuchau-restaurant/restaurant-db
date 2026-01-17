/**
 * Migration 006: Constraints and Indexes
 * - Add circular FK: tables.current_order_id -> orders.id
 * - Create all indexes for tenant_id and foreign keys
 */

export async function up(knex) {
    // 1. Xử lý circular dependency: tables -> orders
    await knex.raw(`
    ALTER TABLE tables
    ADD CONSTRAINT fk_tables_current_order
    FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL;
  `);

    // 2. Indexes for tenant_id (BẮT BUỘC cho multi-tenant performance)
    await knex.raw(`CREATE INDEX idx_users_tenant ON users(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_tables_tenant ON tables(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_categories_tenant ON categories(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_dishes_tenant ON dishes(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_customers_tenant ON customers(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_orders_tenant ON orders(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_order_details_tenant ON order_details(tenant_id);`);
    await knex.raw(`CREATE INDEX idx_payments_tenant ON payments(tenant_id);`);

    // 3. Indexes for common foreign keys
    await knex.raw(`CREATE INDEX idx_dishes_category ON dishes(category_id);`);
    await knex.raw(`CREATE INDEX idx_orders_customer ON orders(customer_id);`);
    await knex.raw(`CREATE INDEX idx_orders_table ON orders(table_id);`);
    await knex.raw(`CREATE INDEX idx_order_details_order ON order_details(order_id);`);
}

export async function down(knex) {
    // Drop indexes for foreign keys
    await knex.raw(`DROP INDEX IF EXISTS idx_order_details_order;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_orders_table;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_orders_customer;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_dishes_category;`);

    // Drop indexes for tenant_id
    await knex.raw(`DROP INDEX IF EXISTS idx_payments_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_order_details_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_orders_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_customers_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_dishes_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_categories_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_tables_tenant;`);
    await knex.raw(`DROP INDEX IF EXISTS idx_users_tenant;`);

    // Drop circular FK constraint
    await knex.raw(`ALTER TABLE tables DROP CONSTRAINT IF EXISTS fk_tables_current_order;`);
}

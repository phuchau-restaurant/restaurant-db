/**
 * Migration 002: ENUM Types
 * All custom PostgreSQL ENUM types for the restaurant system
 */

export async function up(knex) {
    // 1. Order status
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('Unsubmit', 'Approved', 'Pending', 'Completed', 'Served', 'Paid', 'Cancelled');
      END IF;
    END $$;
  `);

    // 2. Item status (từng món trong đơn)
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM ('Pending', 'Ready', 'Served', 'Cancelled');
      END IF;
    END $$;
  `);

    // 3. Table status
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_status') THEN
        CREATE TYPE table_status AS ENUM ('Active', 'Inactive', 'Available', 'Occupied');
      END IF;
    END $$;
  `);

    // 4. Table location
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_location') THEN
        CREATE TYPE table_location AS ENUM ('Indoor', 'Outdoor', 'Patio', 'VIP_Room');
      END IF;
    END $$;
  `);

    // 5. User role
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Admin', 'Chef', 'Waiter');
      END IF;
    END $$;
  `);

    // 6. Dish status
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dish_status') THEN
        CREATE TYPE dish_status AS ENUM ('Available', 'Unavailable', 'Sold_out');
      END IF;
    END $$;
  `);

    // 7. Payment method
    await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('Cash', 'Card', 'E-Wallet');
      END IF;
    END $$;
  `);
}

export async function down(knex) {
    await knex.raw(`DROP TYPE IF EXISTS payment_method_enum;`);
    await knex.raw(`DROP TYPE IF EXISTS dish_status;`);
    await knex.raw(`DROP TYPE IF EXISTS user_role;`);
    await knex.raw(`DROP TYPE IF EXISTS table_location;`);
    await knex.raw(`DROP TYPE IF EXISTS table_status;`);
    await knex.raw(`DROP TYPE IF EXISTS item_status;`);
    await knex.raw(`DROP TYPE IF EXISTS order_status;`);
}

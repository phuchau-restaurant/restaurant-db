/**
 * Migration 001: Extensions and Helper Functions
 * - Enable pgcrypto extension
 * - Create uuid_generate_v7() function
 */

export async function up(knex) {
    await knex.raw(`
    -- Enable pgcrypto extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `);

    await knex.raw(`
    -- Function to generate UUIDv7 (timestamp-based UUID)
    CREATE OR REPLACE FUNCTION uuid_generate_v7()
    RETURNS uuid
    LANGUAGE plpgsql
    VOLATILE
    AS $$
    DECLARE
      ts_bytes BYTEA;
      uuid_bytes BYTEA;
    BEGIN
      -- 48-bit Unix timestamp (ms)
      ts_bytes := decode(
        lpad(
          to_hex(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint),
          12,
          '0'
        ),
        'hex'
      );
      -- Random base
      uuid_bytes := gen_random_bytes(16);
      -- Inject timestamp
      uuid_bytes := overlay(uuid_bytes placing ts_bytes from 1 for 6);
      -- Version = 7
      uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
      -- Variant = RFC 4122
      uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
      
      RETURN encode(uuid_bytes, 'hex')::uuid;
    END;
    $$;
  `);
}

export async function down(knex) {
    await knex.raw(`DROP FUNCTION IF EXISTS uuid_generate_v7();`);
    // Note: We don't drop pgcrypto as it might be used by other parts
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) => knex.schema.createTable('tenants', (table) => {
  // primary key
  table.uuid('tenant_id').primary().defaultTo(knex.raw('(UUID())'));
  table.string('tenant_name').notNullable();
  table.string('tenant_contact_name').notNullable();
  table.string('tenant_email').notNullable();
  table.string('tenant_phone').notNullable();
  table.timestamps(true, true);
});


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  knex.schema.dropTable('tenants');
};

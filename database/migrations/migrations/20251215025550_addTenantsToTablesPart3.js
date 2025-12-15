/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.raw(`alter table point_threshold add column tenant_id CHAR(36) first`);
  await knex.schema.raw(`alter table riding_area_status add column tenant_id CHAR(36) after riding_area_status_id`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

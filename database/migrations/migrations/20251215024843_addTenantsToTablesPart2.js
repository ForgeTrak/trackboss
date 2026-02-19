/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.raw(`alter table membership_tags add column tenant_id CHAR(36) after membership_tag_id`);
  await knex.schema.raw(`alter table membership_types add column tenant_id CHAR(36) after membership_type_id`);
  await knex.schema.raw(`alter table member_status add column tenant_id CHAR(36) after member_status_id`);
  await knex.schema.raw(`alter table member_types add column tenant_id CHAR(36) after member_type_id`);
  await knex.schema.raw(`alter table paid_labor add column tenant_id CHAR(36) after paid_labor_id`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.raw(`alter table board_member add column tenant_id CHAR(36) after board_id`);
  await knex.schema.raw(`alter table board_member_title add column tenant_id CHAR(36) after board_title_id`);
  await knex.schema.raw(`alter table default_settings add column tenant_id CHAR(36) after default_setting_id`);
  await knex.schema.raw(`alter table earned_points_history add column tenant_id CHAR(36) after earned_points_history_id`);
  await knex.schema.raw(`alter table emails add column tenant_id CHAR(36) after email_id`);
  await knex.schema.raw(`alter table event add column tenant_id CHAR(36) after event_id`);
  await knex.schema.raw(`alter table event_job add column tenant_id CHAR(36) after event_job_id`);
  await knex.schema.raw(`alter table event_type add column tenant_id CHAR(36) after event_type_id`);
  await knex.schema.raw(`alter table event_type_relationship add column tenant_id CHAR(36) after event_type_relationship_id`);
  await knex.schema.raw(`alter table gate_code add column tenant_id CHAR(36) after gate_code_id`);
  await knex.schema.raw(`alter table job add column tenant_id CHAR(36) after job_id`);
  await knex.schema.raw(`alter table job_type add column tenant_id CHAR(36) after job_type_id`);
  await knex.schema.raw(`alter table link add column tenant_id CHAR(36) after link_id`);
  await knex.schema.raw(`alter table member add column tenant_id CHAR(36) after member_id`);
  await knex.schema.raw(`alter table member_bikes add column tenant_id CHAR(36) after bike_id`);
  await knex.schema.raw(`alter table member_bill add column tenant_id CHAR(36) after bill_id`);
  await knex.schema.raw(`alter table member_communication add column tenant_id CHAR(36) after member_communication_id`);
  await knex.schema.raw(`alter table membership add column tenant_id CHAR(36) after membership_id`);
  await knex.schema.raw(`alter table membership_application add column tenant_id CHAR(36) after membership_application_id`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

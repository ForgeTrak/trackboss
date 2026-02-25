/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.raw(`drop procedure sp_patch_board_member`);
  await knex.schema.raw(`drop procedure sp_register_membership`);
  await knex.schema.raw(`drop procedure sp_patch_bill`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

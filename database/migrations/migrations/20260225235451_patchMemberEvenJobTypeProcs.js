/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.raw('drop procedure sp_patch_member_type');
    await knex.schema.raw('drop procedure sp_patch_event_job');
    await knex.schema.raw('drop procedure sp_patch_job_type');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

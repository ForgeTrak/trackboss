/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    return knex.schema.alterTable('tenants', function (table) {
        table.string('slug');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    return knex.schema.alterTable('tenants', function (table) {
        table.dropColumn('slug');
    });
};

exports.up = async function (knex) {
    await knex.schema.createTable('attendance', (table) => {
        table.primary(['attendance_id']);
        table.increments('attendance_id');
        table.string('tenant_id', 255).notNullable();
        table.integer('member_id').unsigned().notNullable();
        table.integer('membership_id').unsigned().notNullable();
        table.datetime('check_in_time').notNullable().defaultTo(knex.fn.now());
        table.timestamps(true, true);
    });
    await knex.schema.raw('create index idx_attendance_tenant_id on attendance (tenant_id)');
    await knex.schema.raw('create index idx_attendance_member_id on attendance (member_id)');
    await knex.schema.raw('create index idx_attendance_check_in_time on attendance (check_in_time)');
};

exports.down = async function (knex) {
    await knex.schema.dropTable('attendance');
};

exports.up = async function (knex) {
    /**
        tenantId: req.user.tenantId,
        userEmail: req.user.email,
        entityType,
        entityId,
        action,
        before,
        after,
     */
    await knex.schema.createTable('audit_log', (table) => {
        // primary key
        table.primary(['audit_log_id']);
        table.increments('audit_log_id');
        table.string('tenant_id', 255).notNullable();
        table.string('user_id', 255).notNullable();
        table.string('user_email', 255).notNullable();
        table.string('entity_type', 255).notNullable();
        table.string('entity_id', 255).notNullable();
        table.string('user_action', 50).notNullable();
        table.json('change_details').nullable();
        table.timestamps(true, true);
    });
    await knex.schema.raw('create index idx_audit_log_tenant_id on audit_log (tenant_id)');
    await knex.schema.raw('create index idx_audit_log_entity_type on audit_log (entity_type)');
    await knex.schema.raw('create index idx_audit_log_entity_id on audit_log (entity_id)');
};

exports.down = async function (knex) {
    await knex.schema.dropTable('audit_log');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.raw(`drop procedure sp_patch_member`);
    await knex.schema.raw(`
CREATE PROCEDURE sp_patch_member(
    IN _member_id INT,
    IN _membership_id INT,
    IN _uuid VARCHAR(255),
    IN _active BIT,
    IN _member_type_id INT,
    IN _first_name VARCHAR(255),
    IN _last_name VARCHAR(255),
    IN _phone_number VARCHAR(255),
    IN _occupation VARCHAR(255),
    IN _email VARCHAR(255),
    IN _birthdate DATE,
    IN _date_joined DATE,
    IN _modified_by INT,
    IN _tenant_id VARCHAR(255)
)
BEGIN
    SELECT membership_id, uuid, member_type_id, first_name, last_name,
        phone_number, occupation, email, birthdate, date_joined, active
    INTO @cur_membership_id, @cur_uuid, @cur_member_type_id, @cur_first_name,
        @cur_last_name, @cur_phone_number, @cur_occupation, @cur_email,
        @cur_birthdate, @cur_date_joined, @cur_active
    FROM member
    WHERE member_id = _member_id and tenant_id = _tenant_id;

UPDATE member 
SET 
    membership_id = IFNULL(_membership_id, @cur_membership_id),
    uuid = IFNULL(_uuid, @cur_uuid),
    member_type_id = IFNULL(_member_type_id, @cur_member_type_id),
    first_name = IFNULL(_first_name, @cur_first_name),
    last_name = IFNULL(_last_name, @cur_last_name),
    phone_number = IFNULL(_phone_number, @cur_phone_number),
    occupation = IFNULL(_occupation, @cur_occupation),
    email = IFNULL(_email, @cur_email),
    birthdate = IFNULL(_birthdate, @cur_birthdate),
    date_joined = IFNULL(_date_joined, @cur_date_joined),
    active = IFNULL(_active, @cur_active),
    last_modified_date = CURDATE(),
    last_modified_by = _modified_by
WHERE
    member_id = _member_id and tenant_id = _tenant_id;
END
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

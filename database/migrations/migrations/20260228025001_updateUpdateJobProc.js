/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.raw(`drop procedure sp_patch_job`);
    await knex.schema.raw(`
CREATE PROCEDURE sp_patch_job(
	IN _job_id INT,
    IN _tenant_id VARCHAR(255),
    IN _member_id INT,
    IN _event_id INT,
	IN _job_type_id INT,
    IN _job_start_date DATETIME,
	IN _job_end_date DATETIME,
    IN _points_awarded FLOAT,
    IN _verified BIT,
	IN _paid BIT,
    IN _modified_by INT
)
BEGIN
    SELECT member_id, event_id, job_type_id, job_start_date, job_end_date, points_awarded,
        verified, paid
    INTO @cur_member_id, @cur_event_id, @cur_job_type_id, @cur_job_start_date,
        @cur_job_end_date, @cur_points_awarded, @cur_verified, @cur_paid
    FROM job
    WHERE job_id = _job_id AND tenant_id = _tenant_id;
 
	IF IFNULL(_verified, @cur_verified) != @cur_verified THEN
		UPDATE job SET verified = _verified, verified_date = 
		CASE WHEN _verified = 0 THEN null
		ELSE CURDATE()
		END
		WHERE job_id = _job_id AND tenant_id = _tenant_id;
	END IF;

	IF IFNULL(_paid, @cur_paid) != @cur_paid THEN
		UPDATE job SET paid = _paid, paid_date = 
		CASE WHEN _paid = 0 THEN null
		ELSE CURDATE() 
		END
		WHERE job_id = _job_id AND tenant_id = _tenant_id;
	END IF;
		
	UPDATE job 
	SET 
		member_id = IFNULL(_member_id, @cur_member_id),
		event_id = IFNULL(_event_id, @cur_event_id),
		job_type_id = IFNULL(_job_type_id, @cur_job_type_id),
		job_start_date = IFNULL(_job_start_date, @cur_job_start_date),
		job_end_date = IFNULL(_job_end_date, @cur_job_end_date),
		points_awarded = IFNULL(_points_awarded, @cur_points_awarded),
		last_modified_date = CURDATE(),
		last_modified_by = _modified_by
	WHERE
		job_id = _job_id AND tenant_id = _tenant_id;
END`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

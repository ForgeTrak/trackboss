/**
 * Recreate sp_patch_job to accept paid_labor and paid_labor_id parameters.
 *
 * Without this, PATCH /api/job/:jobId silently drops paidLabor / paidLaborId
 * updates because the original stored procedure only accepts 11 inputs and
 * the extra values from the patch handler are discarded by mysql2. This
 * caused paid-laborer signups (and free-form paid labor names) to never
 * actually persist on the job row.
 */
exports.up = async function up(knex) {
    await knex.raw('DROP PROCEDURE IF EXISTS sp_patch_job');
    await knex.raw(`
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
      IN _modified_by INT,
      IN _paid_labor VARCHAR(255),
      IN _paid_labor_id INT
    )
    BEGIN
      SELECT member_id, event_id, job_type_id, job_start_date, job_end_date, points_awarded,
        verified, paid, paid_labor, paid_labor_id
      INTO @cur_member_id, @cur_event_id, @cur_job_type_id, @cur_job_start_date,
        @cur_job_end_date, @cur_points_awarded, @cur_verified, @cur_paid,
        @cur_paid_labor, @cur_paid_labor_id
      FROM job
      WHERE job_id = _job_id AND tenant_id = _tenant_id;

      IF IFNULL(_verified, @cur_verified) != @cur_verified THEN
        UPDATE job SET verified = _verified, verified_date =
          CASE WHEN _verified = 0 THEN NULL ELSE CURDATE() END
        WHERE job_id = _job_id AND tenant_id = _tenant_id;
      END IF;

      IF IFNULL(_paid, @cur_paid) != @cur_paid THEN
        UPDATE job SET paid = _paid, paid_date =
          CASE WHEN _paid = 0 THEN NULL ELSE CURDATE() END
        WHERE job_id = _job_id AND tenant_id = _tenant_id;
      END IF;

      UPDATE job SET
        member_id = IFNULL(_member_id, @cur_member_id),
        event_id = IFNULL(_event_id, @cur_event_id),
        job_type_id = IFNULL(_job_type_id, @cur_job_type_id),
        job_start_date = IFNULL(_job_start_date, @cur_job_start_date),
        job_end_date = IFNULL(_job_end_date, @cur_job_end_date),
        points_awarded = IFNULL(_points_awarded, @cur_points_awarded),
        paid_labor = IFNULL(_paid_labor, @cur_paid_labor),
        paid_labor_id = IFNULL(_paid_labor_id, @cur_paid_labor_id),
        last_modified_date = CURDATE(),
        last_modified_by = _modified_by
      WHERE job_id = _job_id AND tenant_id = _tenant_id;
    END
  `);
};

exports.down = async function down(knex) {
    await knex.raw('DROP PROCEDURE IF EXISTS sp_patch_job');
    await knex.raw(`
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
          CASE WHEN _verified = 0 THEN NULL ELSE CURDATE() END
        WHERE job_id = _job_id AND tenant_id = _tenant_id;
      END IF;

      IF IFNULL(_paid, @cur_paid) != @cur_paid THEN
        UPDATE job SET paid = _paid, paid_date =
          CASE WHEN _paid = 0 THEN NULL ELSE CURDATE() END
        WHERE job_id = _job_id AND tenant_id = _tenant_id;
      END IF;

      UPDATE job SET
        member_id = IFNULL(_member_id, @cur_member_id),
        event_id = IFNULL(_event_id, @cur_event_id),
        job_type_id = IFNULL(_job_type_id, @cur_job_type_id),
        job_start_date = IFNULL(_job_start_date, @cur_job_start_date),
        job_end_date = IFNULL(_job_end_date, @cur_job_end_date),
        points_awarded = IFNULL(_points_awarded, @cur_points_awarded),
        last_modified_date = CURDATE(),
        last_modified_by = _modified_by
      WHERE job_id = _job_id AND tenant_id = _tenant_id;
    END
  `);
};

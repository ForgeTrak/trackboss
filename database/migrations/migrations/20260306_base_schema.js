/**
 * Base schema migration.  These are the base tables, views, and procs for the application.
 * 
 * You'll need to 'create schema' first, then run this migration.
 *
 * Tables are created with FK checks disabled to avoid circular-dependency
 * issues (member <-> membership).  Views, stored procedures, and FK checks
 * are restored afterward.
 */

exports.up = async function (knex) {
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');

  // ---------------------------------------------------------------
  // Independent / lookup tables
  // ---------------------------------------------------------------

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS tenants (
      tenant_id char(36) NOT NULL DEFAULT (uuid()),
      tenant_name varchar(255) NOT NULL,
      tenant_contact_name varchar(255) NOT NULL,
      tenant_email varchar(255) NOT NULL,
      tenant_phone varchar(255) NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tenant_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_types (
      member_type_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      type varchar(255) NOT NULL,
      base_dues_amt float DEFAULT NULL,
      PRIMARY KEY (member_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS membership_types (
      membership_type_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      type varchar(255) NOT NULL,
      base_dues_amt float DEFAULT NULL,
      PRIMARY KEY (membership_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS board_member_title (
      board_title_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      title varchar(255) NOT NULL,
      assigned_email varchar(255) DEFAULT NULL,
      PRIMARY KEY (board_title_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS default_settings (
      default_setting_id int unsigned NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      default_setting_name text NOT NULL,
      default_setting_value text NOT NULL,
      default_setting_type varchar(10) NOT NULL DEFAULT 'string',
      default_setting_display_name varchar(255) DEFAULT NULL,
      PRIMARY KEY (default_setting_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS emails (
      email_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      purpose varchar(45) NOT NULL,
      subject varchar(255) DEFAULT NULL,
      text varchar(4000) DEFAULT NULL,
      PRIMARY KEY (email_id),
      UNIQUE KEY email_id_UNIQUE (email_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS gate_code (
      gate_code_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      year int DEFAULT NULL,
      gate_code varchar(20) DEFAULT NULL,
      PRIMARY KEY (gate_code_id),
      UNIQUE KEY gate_code_id_UNIQUE (gate_code_id),
      KEY idx_gate_code_year (year)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS link (
      link_id int unsigned NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      link_title text NOT NULL,
      link_url text NOT NULL,
      display_order int NOT NULL,
      online tinyint(1) DEFAULT '1',
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (link_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS paid_labor (
      paid_labor_id int unsigned NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      last_name text,
      first_name text,
      business_name text,
      phone text,
      email text,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (paid_labor_id),
      KEY paid_labor_paid_labor_id_index (paid_labor_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS point_threshold (
      tenant_id char(36) DEFAULT NULL,
      year int NOT NULL,
      amount int NOT NULL,
      PRIMARY KEY (year)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS riding_area_status (
      riding_area_status_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      area_name varchar(255) NOT NULL,
      status bit(1) NOT NULL,
      PRIMARY KEY (riding_area_status_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS earned_points_history (
      earned_points_history_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      membership_id int DEFAULT NULL,
      date datetime DEFAULT NULL,
      description text,
      point_value int DEFAULT NULL,
      old_member_id int DEFAULT NULL,
      PRIMARY KEY (earned_points_history_id),
      KEY idx_points_history_date_member (date, old_member_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_communication (
      member_communication_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      subject varchar(255) DEFAULT NULL,
      sender_id int DEFAULT NULL,
      text mediumtext,
      mechanism varchar(50) DEFAULT NULL,
      selected_tags json DEFAULT NULL,
      recipients json DEFAULT NULL,
      creation_date datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (member_communication_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS membership_application (
      membership_application_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      application_status varchar(50) NOT NULL,
      application_email varchar(255) NOT NULL,
      application_date datetime DEFAULT CURRENT_TIMESTAMP,
      application_json json DEFAULT NULL,
      application_notes_internal varchar(4000) DEFAULT NULL,
      application_notes_shared varchar(4000) DEFAULT NULL,
      application_priority int DEFAULT NULL,
      application_season int DEFAULT '2024',
      PRIMARY KEY (membership_application_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS event_type_relationship (
      event_type_relationship_id int unsigned NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      event_type_id int NOT NULL,
      related_event_type_id int NOT NULL,
      day_difference int NOT NULL,
      description varchar(255) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (event_type_relationship_id)
    )  `);

  // ---------------------------------------------------------------
  // Core tables with foreign-key relationships
  // ---------------------------------------------------------------

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS membership (
      membership_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      status enum('Pending','Active','Former','Disabled') NOT NULL,
      cur_year_renewed bit(1) NOT NULL,
      view_online bit(1) NOT NULL,
      renewal_sent bit(1) NOT NULL,
      last_modified_date date DEFAULT NULL,
      last_modified_by int DEFAULT NULL,
      year_joined int DEFAULT NULL,
      address varchar(255) DEFAULT NULL,
      city varchar(255) DEFAULT NULL,
      state varchar(255) DEFAULT NULL,
      zip varchar(255) DEFAULT NULL,
      membership_admin_id int DEFAULT NULL,
      OLD_MEMBERSHIP_ID int DEFAULT NULL,
      membership_type_id int DEFAULT NULL,
      cancel_reason varchar(255) DEFAULT NULL,
      PRIMARY KEY (membership_id),
      KEY FK_membership_lm_idx (last_modified_by),
      KEY FK_membership_admin_idx (membership_admin_id),
      KEY FK_membership_type_idx (membership_type_id),
      CONSTRAINT FK_membership_admin FOREIGN KEY (membership_admin_id) REFERENCES member (member_id) ON DELETE CASCADE,
      CONSTRAINT FK_membership_lm FOREIGN KEY (last_modified_by) REFERENCES member (member_id),
      CONSTRAINT FK_membership_type FOREIGN KEY (membership_type_id) REFERENCES membership_types (membership_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member (
      member_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      membership_id int DEFAULT NULL,
      uuid varchar(255) DEFAULT NULL,
      member_type_id int NOT NULL,
      first_name varchar(255) DEFAULT NULL,
      last_name varchar(255) DEFAULT NULL,
      phone_number varchar(255) DEFAULT NULL,
      occupation varchar(255) DEFAULT NULL,
      email varchar(255) DEFAULT NULL,
      birthdate date DEFAULT NULL,
      date_joined date DEFAULT NULL,
      last_modified_date date DEFAULT NULL,
      last_modified_by int DEFAULT NULL,
      active bit(1) NOT NULL,
      OLD_MEMBER_ID int DEFAULT NULL,
      end_date datetime DEFAULT NULL,
      subscribed varchar(255) DEFAULT NULL,
      dependent_status varchar(255) DEFAULT NULL,
      is_eligible_dependent tinyint(1) DEFAULT '0',
      PRIMARY KEY (member_id),
      UNIQUE KEY uuid_UNIQUE (uuid),
      KEY member_type_id_idx (member_type_id),
      KEY last_modified_by_idx (last_modified_by),
      KEY membership_id_idx (membership_id),
      CONSTRAINT FK_member_lm FOREIGN KEY (last_modified_by) REFERENCES member (member_id),
      CONSTRAINT FK_member_membership FOREIGN KEY (membership_id) REFERENCES membership (membership_id) ON DELETE CASCADE,
      CONSTRAINT FK_member_type FOREIGN KEY (member_type_id) REFERENCES member_types (member_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS event_type (
      event_type_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      type varchar(255) NOT NULL,
      last_modified_date date DEFAULT NULL,
      last_modified_by int DEFAULT NULL,
      active bit(1) NOT NULL,
      default_start time DEFAULT NULL,
      default_end time DEFAULT NULL,
      PRIMARY KEY (event_type_id),
      KEY FK_event_type_lm_idx (last_modified_by),
      CONSTRAINT FK_event_type_lm FOREIGN KEY (last_modified_by) REFERENCES member (member_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS event (
      event_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      event_type_id int NOT NULL,
      event_name varchar(255) DEFAULT NULL,
      event_description varchar(255) DEFAULT NULL,
      start_date datetime DEFAULT NULL,
      end_date datetime DEFAULT NULL,
      OLD_SCHEDULE_DATE_ID int DEFAULT NULL,
      restrict_signups tinyint(1) DEFAULT '0',
      PRIMARY KEY (event_id),
      KEY event_type_id_idx (event_type_id),
      CONSTRAINT FK_event_type FOREIGN KEY (event_type_id) REFERENCES event_type (event_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS job_type (
      job_type_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      title varchar(255) NOT NULL,
      point_value float DEFAULT NULL,
      cash_value float DEFAULT NULL,
      job_day_number int DEFAULT NULL,
      start_time time DEFAULT NULL,
      end_time time DEFAULT NULL,
      active bit(1) NOT NULL,
      reserved bit(1) NOT NULL,
      online bit(1) NOT NULL,
      meal_ticket bit(1) NOT NULL,
      sort_order int DEFAULT NULL,
      last_modified_date date DEFAULT NULL,
      last_modified_by int DEFAULT NULL,
      OLD_JOB_ID int DEFAULT NULL,
      PRIMARY KEY (job_type_id),
      KEY last_modified_by_idx (last_modified_by),
      CONSTRAINT FK_jobtype_lm FOREIGN KEY (last_modified_by) REFERENCES member (member_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS job (
      job_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      member_id int DEFAULT NULL,
      paid_labor varchar(255) DEFAULT NULL,
      event_id int DEFAULT NULL,
      job_type_id int NOT NULL,
      job_start_date datetime DEFAULT NULL,
      job_end_date datetime DEFAULT NULL,
      last_modified_date date DEFAULT NULL,
      last_modified_by int DEFAULT NULL,
      verified bit(1) NOT NULL,
      verified_date date DEFAULT NULL,
      points_awarded float DEFAULT NULL,
      paid bit(1) NOT NULL,
      paid_date date DEFAULT NULL,
      cash_payout float DEFAULT NULL,
      paid_labor_id int DEFAULT NULL,
      PRIMARY KEY (job_id),
      KEY member_id_idx (member_id),
      KEY event_id_idx (event_id),
      KEY job_type_id_idx (job_type_id),
      KEY last_modified_by_idx (last_modified_by),
      CONSTRAINT FK_job_event FOREIGN KEY (event_id) REFERENCES event (event_id),
      CONSTRAINT FK_job_lm FOREIGN KEY (last_modified_by) REFERENCES member (member_id),
      CONSTRAINT FK_job_member FOREIGN KEY (member_id) REFERENCES member (member_id),
      CONSTRAINT FK_job_type FOREIGN KEY (job_type_id) REFERENCES job_type (job_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS event_job (
      event_job_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      event_type_id int NOT NULL,
      job_type_id int NOT NULL,
      count int NOT NULL,
      PRIMARY KEY (event_job_id),
      KEY event_type_id_idx (event_type_id),
      KEY job_type_id_idx (job_type_id),
      CONSTRAINT FK_ej_eventtype FOREIGN KEY (event_type_id) REFERENCES event_type (event_type_id),
      CONSTRAINT FK_ej_jobtype FOREIGN KEY (job_type_id) REFERENCES job_type (job_type_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS board_member (
      board_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      year int DEFAULT NULL,
      member_id int DEFAULT NULL,
      board_title_id int NOT NULL,
      PRIMARY KEY (board_id),
      KEY board_title_id_idx (board_title_id),
      KEY member_id_idx (member_id),
      CONSTRAINT FK_board_member FOREIGN KEY (member_id) REFERENCES member (member_id),
      CONSTRAINT FK_board_title FOREIGN KEY (board_title_id) REFERENCES board_member_title (board_title_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_bikes (
      bike_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      year varchar(10) DEFAULT NULL,
      make varchar(50) DEFAULT NULL,
      model varchar(50) DEFAULT NULL,
      membership_id int NOT NULL,
      PRIMARY KEY (bike_id),
      KEY membership_id_idx (membership_id),
      CONSTRAINT FK_bike_membership FOREIGN KEY (membership_id) REFERENCES membership (membership_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_bill (
      bill_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      generated_date date DEFAULT NULL,
      year int DEFAULT NULL,
      amount double DEFAULT NULL,
      amount_with_fee double DEFAULT NULL,
      membership_id int NOT NULL,
      emailed_bill date DEFAULT NULL,
      cur_year_paid bit(1) NOT NULL,
      threshold double DEFAULT NULL,
      points_earned double DEFAULT NULL,
      work_detail json DEFAULT NULL,
      cur_year_ins bit(1) NOT NULL,
      payment_method varchar(45) DEFAULT NULL,
      last_updated_date datetime DEFAULT CURRENT_TIMESTAMP,
      square_link varchar(255) DEFAULT NULL,
      square_order_id varchar(45) DEFAULT NULL,
      renewal_contacted tinyint DEFAULT NULL,
      PRIMARY KEY (bill_id),
      KEY membership_id_idx (membership_id),
      KEY idx_member_bill_year (year),
      CONSTRAINT FK_bill_membership FOREIGN KEY (membership_id) REFERENCES membership (membership_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_status (
      member_status_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      member_id int NOT NULL,
      year int DEFAULT NULL,
      status varchar(255) DEFAULT NULL,
      PRIMARY KEY (member_status_id),
      KEY member_id_idx (member_id),
      CONSTRAINT FK_status_member FOREIGN KEY (member_id) REFERENCES member (member_id)
    )  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS membership_tags (
      membership_tag_id int NOT NULL AUTO_INCREMENT,
      tenant_id char(36) DEFAULT NULL,
      membership_id int NOT NULL,
      membership_tag varchar(255) DEFAULT NULL,
      PRIMARY KEY (membership_tag_id),
      KEY MEMBERSHIP_ID_IDX (membership_tag, membership_id),
      KEY MEMBERSHIP_TAG_IDX (membership_tag)
    )  `);

  // ---------------------------------------------------------------
  // Views (ordered by dependency)
  // ---------------------------------------------------------------

  await knex.raw(`
    CREATE OR REPLACE VIEW v_event_type AS
    SELECT
      et.event_type_id,
      et.tenant_id,
      et.type,
      et.active,
      CONCAT(m.first_name, ' ', m.last_name) AS last_modified_by,
      DATE_FORMAT(et.last_modified_date, '%Y-%m-%d') AS last_modified_date
    FROM event_type et
    LEFT JOIN member m
      ON m.member_id = et.last_modified_by
      AND et.tenant_id = m.tenant_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_event AS
    SELECT
      e.event_id,
      e.tenant_id,
      et.event_type_id,
      DATE_FORMAT(e.start_date, '%Y-%m-%d %H:%i:%s') AS \`start\`,
      DATE_FORMAT(e.end_date, '%Y-%m-%d %H:%i:%s')   AS \`end\`,
      et.type          AS event_type,
      e.event_name     AS title,
      e.event_description,
      e.restrict_signups
    FROM event e
    LEFT JOIN event_type et
      ON e.event_type_id = et.event_type_id
      AND e.tenant_id = et.tenant_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_events_by_year AS
    SELECT
      tenant_id,
      YEAR(\`start\`)  AS event_year,
      event_type,
      COUNT(0)         AS event_count
    FROM v_event
    WHERE \`start\` <= NOW()
    GROUP BY YEAR(\`start\`), event_type
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_event_job AS
    SELECT
      ej.event_job_id,
      ej.tenant_id,
      et.event_type_id,
      et.type   AS event_type,
      jt.job_type_id,
      jt.title  AS job_type,
      ej.count
    FROM event_job ej
    LEFT JOIN event_type et
      ON ej.event_type_id = et.event_type_id
      AND ej.tenant_id = et.tenant_id
    LEFT JOIN job_type jt
      ON ej.job_type_id = jt.job_type_id
      AND ej.tenant_id = jt.tenant_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_job_type AS
    SELECT
      jt.job_type_id,
      jt.tenant_id,
      jt.title,
      jt.point_value,
      jt.cash_value,
      jt.job_day_number,
      jt.active,
      jt.reserved,
      jt.online,
      jt.meal_ticket,
      jt.sort_order,
      DATE_FORMAT(jt.last_modified_date, '%Y-%m-%d') AS last_modified_date,
      jt.last_modified_by
    FROM job_type jt
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_member_type AS
    SELECT
      mt.member_type_id,
      mt.tenant_id,
      mt.type,
      mt.base_dues_amt
    FROM member_types mt
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_bike AS
    SELECT
      b.bike_id,
      b.tenant_id,
      b.year,
      b.make,
      b.model,
      b.membership_id,
      CONCAT(m.first_name, ' ', m.last_name) AS membership_admin
    FROM member_bikes b
    LEFT JOIN membership ms
      ON b.membership_id = ms.membership_id
      AND b.tenant_id = ms.tenant_id
    LEFT JOIN member m
      ON ms.membership_admin_id = m.member_id
      AND b.tenant_id = m.tenant_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_membership AS
    SELECT
      ms.membership_id,
      ms.tenant_id,
      CONCAT(ma.first_name, ' ', ma.last_name) AS membership_admin,
      ms.status,
      (SELECT type FROM membership_types WHERE membership_type_id = ms.membership_type_id) AS membership_type,
      ms.cur_year_renewed,
      ms.renewal_sent,
      ms.year_joined,
      ms.address,
      ms.city,
      ms.state,
      ms.zip,
      DATE_FORMAT(ms.last_modified_date, '%Y-%m-%d') AS last_modified_date,
      CONCAT(lmb.first_name, ' ', lmb.last_name) AS last_modified_by
    FROM membership ms
    LEFT JOIN member ma
      ON ms.membership_admin_id = ma.member_id
      AND ms.tenant_id = ma.tenant_id
    LEFT JOIN member lmb
      ON ms.last_modified_by = lmb.member_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_membership_base_dues AS
    SELECT
      m.tenant_id,
      m.membership_id,
      MIN(mt.base_dues_amt) AS base_dues_amt
    FROM member m
    LEFT JOIN membership ms
      ON m.membership_id = ms.membership_id
      AND m.tenant_id = ms.tenant_id
    LEFT JOIN membership_types mt
      ON ms.membership_type_id = mt.membership_type_id
      AND ms.tenant_id = mt.tenant_id
    GROUP BY m.tenant_id, m.membership_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_member AS
    SELECT
      m.tenant_id,
      m.member_id,
      m.membership_id,
      m.first_name,
      m.last_name,
      ms.membership_admin_id,
      bm.board_title_id,
      CONCAT(ma.first_name, ' ', ma.last_name) AS membership_admin,
      m.uuid,
      m.active,
      mt.member_type_id,
      mt.type AS member_type,
      mst.type AS membership_type,
      mst.membership_type_id,
      m.phone_number,
      m.occupation,
      m.email,
      DATE_FORMAT(m.birthdate, '%Y-%m-%d') AS birthdate,
      DATE_FORMAT(m.date_joined, '%Y-%m-%d') AS date_joined,
      ms.address,
      ms.city,
      ms.state,
      ms.zip,
      ms.cancel_reason,
      m.subscribed,
      m.dependent_status,
      m.is_eligible_dependent,
      DATE_FORMAT(m.last_modified_date, '%Y-%m-%d') AS last_modified_date,
      m.last_modified_by
    FROM member m
    LEFT JOIN membership ms
      ON m.membership_id = ms.membership_id
      AND ms.tenant_id = m.tenant_id
    LEFT JOIN member ma
      ON ms.membership_admin_id = ma.member_id
    LEFT JOIN member_types mt
      ON m.member_type_id = mt.member_type_id
    LEFT JOIN membership_types mst
      ON ms.membership_type_id = mst.membership_type_id
    LEFT JOIN board_member bm
      ON m.member_id = bm.member_id
      AND m.tenant_id = bm.tenant_id
      AND bm.year = YEAR(NOW())
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_member_dependent_nostatus AS
    SELECT
      m.last_name,
      m.first_name,
      m.email,
      m.dependent_status,
      m.membership_admin,
      (SELECT member.email FROM member WHERE member.member_id = mb.membership_admin_id) AS admin_email,
      m.birthdate,
      TIMESTAMPDIFF(YEAR, m.birthdate, CURDATE()) AS age
    FROM v_member m
    JOIN membership mb
    WHERE m.birthdate < (NOW() - INTERVAL 18 YEAR)
      AND m.birthdate > (NOW() - INTERVAL 27 YEAR)
      AND m.member_type_id NOT IN (7, 8)
      AND m.active = 1
      AND mb.status = 'Active'
      AND mb.membership_id = m.membership_id
      AND (m.dependent_status IS NULL OR m.dependent_status = 'Child')
      AND m.is_eligible_dependent = 0
    ORDER BY m.last_name, m.first_name
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_bill AS
    SELECT
      mb.bill_id,
      mb.tenant_id,
      DATE_FORMAT(mb.generated_date, '%Y-%m-%d') AS generated_date,
      mb.year,
      ROUND(mb.amount, 2)          AS amount,
      ROUND(mb.amount_with_fee, 2) AS amount_with_fee,
      mb.points_earned,
      mb.threshold,
      ma.last_name,
      ma.first_name,
      CONCAT(ma.first_name, ' ', ma.last_name) AS membership_admin,
      ma.email           AS membership_admin_email,
      ma.phone_number,
      mt.type            AS membership_type,
      ms.status,
      mb.emailed_bill,
      mb.cur_year_paid,
      mb.cur_year_ins,
      mb.membership_id,
      mb.payment_method,
      mb.square_link,
      mb.square_order_id,
      mb.work_detail,
      mb.renewal_contacted
    FROM member_bill mb
    LEFT JOIN membership ms
      ON mb.membership_id = ms.membership_id
      AND mb.tenant_id = ms.tenant_id
    LEFT JOIN member ma
      ON ms.membership_admin_id = ma.member_id
      AND mb.tenant_id = ma.tenant_id
    LEFT JOIN membership_types mt
      ON ms.membership_type_id = mt.membership_type_id
      AND mb.tenant_id = mt.tenant_id
    WHERE ms.status = 'active'
    ORDER BY ma.last_name, ma.first_name, mb.year
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_board_member AS
    SELECT
      bm.board_id,
      bm.tenant_id,
      bt.title,
      bt.board_title_id AS title_id,
      bm.year,
      m.member_id,
      m.membership_id,
      m.first_name,
      m.last_name,
      IFNULL(bt.assigned_email, m.email) AS email,
      m.phone_number
    FROM board_member bm
    LEFT JOIN board_member_title bt
      ON bm.board_title_id = bt.board_title_id
      AND bm.tenant_id = bt.tenant_id
    LEFT JOIN member m
      ON bm.member_id = m.member_id
      AND bm.tenant_id = m.tenant_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_job AS
    SELECT
      j.job_id,
      j.tenant_id,
      CASE
        WHEN j.paid_labor IS NULL AND j.paid_labor_id IS NULL
          THEN CONCAT(m.first_name, ' ', m.last_name)
        WHEN j.paid_labor IS NULL AND j.paid_labor_id IS NOT NULL AND pl.first_name IS NOT NULL
          THEN CONCAT(pl.first_name, ' ', pl.last_name)
        WHEN j.paid_labor IS NULL AND j.paid_labor_id IS NOT NULL AND pl.business_name IS NOT NULL
          THEN pl.business_name
        ELSE j.paid_labor
      END AS member,
      m.member_id,
      m.membership_id,
      pl.paid_labor_id,
      e.event_name    AS event,
      e.event_id,
      e.event_type_id,
      j.job_start_date AS \`start\`,
      j.job_end_date   AS \`end\`,
      jt.job_type_id,
      jt.title,
      j.verified,
      DATE_FORMAT(j.verified_date, '%Y-%m-%d') AS verified_date,
      j.points_awarded,
      j.cash_payout,
      jt.job_day_number,
      jt.meal_ticket,
      jt.sort_order,
      j.paid,
      DATE_FORMAT(j.paid_date, '%Y-%m-%d') AS paid_date,
      DATE_FORMAT(j.last_modified_date, '%Y-%m-%d') AS last_modified_date,
      CONCAT(m2.first_name, ' ', m2.last_name) AS last_modified_by
    FROM job j
    LEFT JOIN member m
      ON m.member_id = j.member_id AND m.tenant_id = j.tenant_id
    LEFT JOIN member m2
      ON m2.member_id = j.last_modified_by AND m2.tenant_id = j.tenant_id
    LEFT JOIN event e
      ON e.event_id = j.event_id AND e.tenant_id = j.tenant_id
    LEFT JOIN job_type jt
      ON j.job_type_id = jt.job_type_id AND jt.tenant_id = j.tenant_id
    LEFT JOIN paid_labor pl
      ON j.paid_labor_id = pl.paid_labor_id AND pl.tenant_id = j.tenant_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_job_alphabetical AS
    SELECT
      j.event_id,
      COALESCE(pl.last_name, m.last_name)   AS last_name,
      COALESCE(pl.first_name, m.first_name) AS first_name,
      IF(j.paid_labor_id IS NOT NULL, 'Paid', 'Member') AS person_type,
      j.job_type_id,
      jt.title
    FROM job j
    JOIN job_type jt ON j.job_type_id = jt.job_type_id
    LEFT JOIN member m ON j.member_id = m.member_id
    LEFT JOIN paid_labor pl ON j.paid_labor_id = pl.paid_labor_id
    WHERE j.event_id IS NOT NULL
    ORDER BY
      j.event_id,
      COALESCE(pl.last_name, m.last_name) IS NULL,
      COALESCE(pl.last_name, m.last_name),
      COALESCE(pl.first_name, m.first_name) IS NULL,
      COALESCE(pl.first_name, m.first_name)
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_meetings_temp AS
    SELECT
      j.membership_id,
      m.last_name,
      m.first_name,
      COUNT(j.title) AS attended
    FROM v_job j
    JOIN member m
    WHERE j.member_id = m.member_id
      AND j.title = 'Attended Meeting'
      AND j.member IS NOT NULL
      AND j.\`start\` <= NOW()
      AND YEAR(j.\`start\`) = 2023
    GROUP BY j.membership_id
    ORDER BY m.last_name, m.first_name
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_registration AS
    SELECT
      m.member_id,
      mt.type AS member_type,
      m.first_name,
      m.last_name,
      m.phone_number,
      m.occupation,
      m.email,
      DATE_FORMAT(m.birthdate, '%Y-%m-%d') AS birthdate,
      ms.address,
      ms.city,
      ms.state,
      ms.zip
    FROM member m
    LEFT JOIN membership ms ON m.membership_id = ms.membership_id
    LEFT JOIN member_types mt ON m.member_type_id = mt.member_type_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_work_points_by_member AS
    SELECT
      tmp.member_id,
      tmp.year,
      SUM(tmp.total_points) AS total_points
    FROM (
      SELECT
        job.member_id,
        YEAR(job.job_start_date) AS year,
        SUM(job.points_awarded)  AS total_points
      FROM job
      WHERE job.paid = 0
      GROUP BY job.member_id, year
      UNION ALL
      SELECT
        m.member_id,
        YEAR(eph.date) AS year,
        SUM(eph.point_value) AS total_points
      FROM earned_points_history eph
      JOIN member m
      WHERE m.OLD_MEMBER_ID = eph.old_member_id
      GROUP BY m.member_id, year
    ) tmp
    GROUP BY tmp.year, tmp.member_id
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW v_work_points_by_membership AS
    SELECT
      tmp.tenant_id,
      tmp.membership_id,
      tmp.year,
      SUM(tmp.total_points) AS total_points
    FROM (
      SELECT
        member.tenant_id,
        job.member_id,
        member.membership_id,
        YEAR(job.job_start_date) AS year,
        SUM(job.points_awarded)  AS total_points
      FROM job
      JOIN member
      WHERE job.paid = 0
        AND job.member_id = member.member_id
        AND job.tenant_id = member.tenant_id
        AND job.job_end_date <= NOW()
      GROUP BY job.member_id, year
      UNION ALL
      SELECT
        m.tenant_id,
        m.member_id,
        m.membership_id,
        YEAR(eph.date) AS year,
        SUM(eph.point_value) AS total_points
      FROM earned_points_history eph
      JOIN member m
      WHERE m.OLD_MEMBER_ID = eph.old_member_id
      GROUP BY m.tenant_id, m.member_id, year
    ) tmp
    GROUP BY tmp.tenant_id, tmp.year, tmp.membership_id
  `);

  // ---------------------------------------------------------------
  // Stored procedures
  // ---------------------------------------------------------------

  await knex.raw(`
    CREATE PROCEDURE sp_event_job_generation(
      IN _event_start_date DATETIME,
      IN _event_end_date DATETIME,
      IN _event_type_id INT,
      IN _event_name VARCHAR(255),
      IN _event_description VARCHAR(255),
      IN _restrict_signups BOOLEAN,
      IN _tenant_id VARCHAR(255),
      OUT _event_id INT
    )
    BEGIN
      DECLARE finished INTEGER DEFAULT 0;
      DECLARE cur_job_type INTEGER DEFAULT 0;
      DECLARE cur_count INTEGER DEFAULT 0;
      DECLARE sqlDOW INT;
      DECLARE _event_type VARCHAR(255);

      DECLARE cursorEJ CURSOR FOR
        SELECT job_type_id, count FROM event_job
        WHERE event_type_id = _event_type_id;

      DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

      INSERT INTO event(tenant_id, start_date, end_date, event_type_id, event_name, event_description, restrict_signups)
        VALUES (_tenant_id, _event_start_date, _event_end_date, _event_type_id, _event_name, _event_description, _restrict_signups);
      SELECT LAST_INSERT_ID() INTO _event_id;

      SELECT type INTO _event_type FROM event_type WHERE event_type_id = _event_type_id AND tenant_id = _tenant_id;

      OPEN cursorEJ;
      getEventJob: LOOP
        FETCH cursorEJ INTO cur_job_type, cur_count;
        IF finished = 1 THEN
          LEAVE getEventJob;
        END IF;

        SET @K = 1;
        lab1: REPEAT
          SELECT job_day_number, start_time, end_time, point_value, cash_value
            INTO @JobDayNumber, @StartTime, @EndTime, @Points, @Cash
            FROM job_type WHERE job_type_id = cur_job_type AND tenant_id = _tenant_id;

          SET @JobDayInterval = 0;
          IF _event_type = 'Race' THEN
            SET @JobDayInterval = @JobDayNumber - 5;
          END IF;
          IF _event_type = 'Harescramble' THEN
            SET @JobDayInterval = @JobDayNumber - 5;
          END IF;

          SET @JobDate = DATE_ADD(_event_start_date, INTERVAL @JobDayInterval DAY);
          SET @JobStart = CAST(CONCAT(@JobDate, 'T', @StartTime) AS DATETIME);
          SET @JobEnd   = CAST(CONCAT(@JobDate, 'T', @EndTime) AS DATETIME);

          INSERT INTO job(event_id, tenant_id, job_type_id, job_start_date, job_end_date, verified, paid, points_awarded, cash_payout)
            VALUES (_event_id, _tenant_id, cur_job_type, IFNULL(@JobStart, IFNULL(@JobDate, NULL)), IFNULL(@JobEnd, IFNULL(@JobDate, NULL)), 0, 0, @Points, @Cash);

          SET @K = @K + 1;
        UNTIL @K > cur_count END REPEAT lab1;
      END LOOP getEventJob;
      CLOSE cursorEJ;
    END
  `);

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

  await knex.raw(`
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
      WHERE member_id = _member_id AND tenant_id = _tenant_id;

      UPDATE member SET
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
      WHERE member_id = _member_id AND tenant_id = _tenant_id;
    END
  `);

  await knex.raw(`
    CREATE PROCEDURE sp_patch_membership(
      IN _membership_id INT,
      IN _membership_admin_id INT,
      IN _status VARCHAR(255),
      IN _cur_year_renewed BIT,
      IN _renewal_sent BIT,
      IN _year_joined INT,
      IN _address VARCHAR(255),
      IN _city VARCHAR(255),
      IN _state VARCHAR(255),
      IN _zip VARCHAR(255),
      IN _modified_by INT,
      IN _tenant_id VARCHAR(255)
    )
    BEGIN
      SELECT membership_admin_id, status, renewal_sent, year_joined, address,
        city, state, zip, cur_year_renewed
      INTO @cur_membership_admin_id, @cur_status, @cur_renewal_sent, @cur_year_joined,
        @cur_address, @cur_city, @cur_state, @cur_zip, @cur_cur_year_renewed
      FROM membership
      WHERE membership_id = _membership_id AND tenant_id = _tenant_id;

      UPDATE membership SET
        membership_admin_id = IFNULL(_membership_admin_id, @cur_membership_admin_id),
        status = IFNULL(_status, @cur_status),
        renewal_sent = IFNULL(_renewal_sent, @cur_renewal_sent),
        year_joined = IFNULL(_year_joined, @cur_year_joined),
        address = IFNULL(_address, @cur_address),
        city = IFNULL(_city, @cur_city),
        state = IFNULL(_state, @cur_state),
        zip = IFNULL(_zip, @cur_zip),
        cur_year_renewed = IFNULL(_cur_year_renewed, @cur_cur_year_renewed),
        last_modified_date = CURDATE(),
        last_modified_by = _modified_by
      WHERE membership_id = _membership_id AND tenant_id = _tenant_id;
    END
  `);

  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
};

exports.down = async function (knex) {
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');

  // Drop stored procedures
  await knex.raw('DROP PROCEDURE IF EXISTS sp_patch_membership');
  await knex.raw('DROP PROCEDURE IF EXISTS sp_patch_member');
  await knex.raw('DROP PROCEDURE IF EXISTS sp_patch_job');
  await knex.raw('DROP PROCEDURE IF EXISTS sp_event_job_generation');

  // Drop views
  const views = [
    'v_work_points_by_membership',
    'v_work_points_by_member',
    'v_registration',
    'v_meetings_temp',
    'v_member_dependent_nostatus',
    'v_member',
    'v_membership_base_dues',
    'v_membership',
    'v_board_member',
    'v_bill',
    'v_bike',
    'v_member_type',
    'v_job_type',
    'v_job_alphabetical',
    'v_job',
    'v_event_job',
    'v_events_by_year',
    'v_event',
    'v_event_type',
  ];
  for (const view of views) {
    await knex.raw(`DROP VIEW IF EXISTS ${view}`);
  }

  // Drop tables (reverse dependency order)
  const tables = [
    'membership_tags',
    'member_status',
    'member_bill',
    'member_bikes',
    'board_member',
    'event_job',
    'job',
    'job_type',
    'event',
    'event_type',
    'member',
    'membership',
    'event_type_relationship',
    'membership_application',
    'member_communication',
    'earned_points_history',
    'riding_area_status',
    'point_threshold',
    'paid_labor',
    'link',
    'gate_code',
    'emails',
    'default_settings',
    'board_member_title',
    'membership_types',
    'member_types',
    'tenants',
  ];
  for (const table of tables) {
    await knex.raw(`DROP TABLE IF EXISTS ${table}`);
  }

  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
};

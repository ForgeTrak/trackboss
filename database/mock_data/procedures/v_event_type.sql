create or replace view v_event_type as
    SELECT 
        et.event_type_id AS event_type_id,
        et.tenant_id AS tenant_id,
        et.type AS type,
        et.active AS active,
        CONCAT(m.first_name, ' ', m.last_name) AS last_modified_by,
        DATE_FORMAT(et.last_modified_date, "%Y-%m-%d") AS last_modified_date
    FROM
        (event_type et
        LEFT JOIN member m ON (m.member_id = et.last_modified_by and et.tenant_id = m.tenant_id))

create or replace view v_job_type as
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
    FROM
        job_type jt


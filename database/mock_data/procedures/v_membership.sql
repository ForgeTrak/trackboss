create or replace view v_membership as 
    SELECT 
        ms.membership_id,
        ms.tenant_id,
        CONCAT(ma.first_name, ' ', ma.last_name) AS membership_admin,
        ms.status,
        (select type from membership_types where membership_type_id = ms.membership_type_id) membership_type,
        ms.cur_year_renewed,
        ms.renewal_sent,
        ms.year_joined,
        ms.address,
        ms.city,
        ms.state,
        ms.zip,
        DATE_FORMAT(ms.last_modified_date, '%Y-%m-%d') AS last_modified_date,
        CONCAT(lmb.first_name, ' ', lmb.last_name) AS last_modified_by
    FROM
        membership ms
            LEFT JOIN
        member ma ON ms.membership_admin_id = ma.member_id and ms.tenant_id = ma.tenant_id
            LEFT JOIN
        member lmb ON ms.last_modified_by = lmb.member_id

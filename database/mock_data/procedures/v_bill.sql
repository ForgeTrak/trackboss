DELIMITER //
create or replace view v_bill as
    SELECT 
        mb.bill_id,
        mb.tenant_id,
        DATE_FORMAT(mb.generated_date, '%Y-%m-%d') AS generated_date,
        mb.year,
        round(mb.amount, 2) as amount,
        round(mb.amount_with_fee, 2) as amount_with_fee,
        mb.points_earned,
        mb.threshold,
        ma.last_name,
        ma.first_name,
        CONCAT(ma.first_name, ' ', ma.last_name) AS membership_admin,
        ma.email AS membership_admin_email,
        ma.phone_number,
        mt.type membership_type,
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
    FROM
        member_bill mb
            LEFT JOIN
        membership ms ON mb.membership_id = ms.membership_id and mb.tenant_id = ms.tenant_id
            LEFT JOIN
        member ma ON ms.membership_admin_id = ma.member_id and mb.tenant_id = ma.tenant_id
            LEFT JOIN 
		membership_types mt on ms.membership_type_id = mt.membership_type_id and mb.tenant_id = mt.tenant_id
	WHERE 
		ms.status = 'active'
	ORDER BY
		last_name, first_name, year;
//

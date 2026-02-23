create or replace view v_board_member as 
    SELECT 
        board_id,
        bm.tenant_id,
        bt.title as title,
        bt.board_title_id as title_id,
        year,
        m.member_id,
        m.membership_id,
        m.first_name, 
        m.last_name,
        ifnull(bt.assigned_email, m.email) email,
        m.phone_number
    FROM
        board_member bm
        LEFT JOIN board_member_title bt ON bm.board_title_id = bt.board_title_id and bm.tenant_id = bt.tenant_id
        left join member m on bm.member_id = m.member_id and bm.tenant_id = m.tenant_id

DELIMITER //
create or replace view v_bike as
    SELECT 
        `b`.`bike_id` AS `bike_id`,
        b.tenant_id AS tenant_id,
        `b`.`year` AS `year`,
        `b`.`make` AS `make`,
        `b`.`model` AS `model`,
        `b`.`membership_id` AS `membership_id`,
        CONCAT(`m`.`first_name`, ' ', `m`.`last_name`) AS `membership_admin`
    FROM
        ((`member_bikes` `b`
        LEFT JOIN `membership` `ms` ON ((`b`.`membership_id` = `ms`.`membership_id`) and b.tenant_id = ms.tenant_id))
        LEFT JOIN `member` `m` ON ((`ms`.`membership_admin_id` = `m`.`member_id`) and b.tenant_id = m.tenant_id))
//

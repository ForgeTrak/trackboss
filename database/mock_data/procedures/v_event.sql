create or replace view v_event as
    SELECT 
        `e`.`event_id` AS `event_id`,
        `e`.`tenant_id` AS `tenant_id`,
        et.event_type_id,
        DATE_FORMAT(`e`.`start_date`, "%Y-%m-%d %H:%i:%s") AS `start`,
        DATE_FORMAT(`e`.`end_date`, "%Y-%m-%d %H:%i:%s") AS `end`,
        `et`.`type` AS `event_type`,
        `e`.`event_name` AS `title`,
        `e`.`event_description` AS `event_description`,
        `e`.`restrict_signups` as `restrict_signups`
    FROM
        (`event` `e`
        LEFT JOIN `event_type` `et` ON ((`e`.`event_type_id` = `et`.`event_type_id`) and (`e`.`tenant_id` = `et`.`tenant_id`)))


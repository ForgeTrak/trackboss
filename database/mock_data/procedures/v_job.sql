   create or replace view v_job as 
   SELECT 
        `j`.`job_id` AS `job_id`,
        `j`.`tenant_id` AS `tenant_id`,
        (CASE
            WHEN
                ((`j`.`paid_labor` IS NULL)
                    AND (`j`.`paid_labor_id` IS NULL))
            THEN
                CONCAT(`m`.`first_name`, ' ', `m`.`last_name`)
            WHEN
                ((`j`.`paid_labor` IS NULL)
                    AND (`j`.`paid_labor_id` IS NOT NULL)
                    and (pl.first_name is not null)
                    )
            THEN
                CONCAT(pl.first_name, ' ', pl.last_name)
            WHEN
                ((`j`.`paid_labor` IS NULL)
                    AND (`j`.`paid_labor_id` IS NOT NULL)
                    and (pl.business_name is not null)
                    )
			then
				pl.business_name
            ELSE `j`.`paid_labor`
        END) AS `member`,
        `m`.`member_id` AS `member_id`,
        `m`.`membership_id` AS `membership_id`,
        `pl`.`paid_labor_id` AS `paid_labor_id`,
        `e`.`event_name` AS `event`,
        `e`.`event_id` AS `event_id`,
        `e`.`event_type_id` AS `event_type_id`,
        `j`.`job_start_date` AS `start`,
        `j`.`job_end_date` AS `end`,
        `jt`.`job_type_id` AS `job_type_id`,
        `jt`.`title` AS `title`,
        `j`.`verified` AS `verified`,
        DATE_FORMAT(`j`.`verified_date`, '%Y-%m-%d') AS `verified_date`,
        `j`.`points_awarded` AS `points_awarded`,
        `j`.`cash_payout` AS `cash_payout`,
        `jt`.`job_day_number` AS `job_day_number`,
        `jt`.`meal_ticket` AS `meal_ticket`,
        `jt`.`sort_order` AS `sort_order`,
        `j`.`paid` AS `paid`,
        DATE_FORMAT(`j`.`paid_date`, '%Y-%m-%d') AS `paid_date`,
        DATE_FORMAT(`j`.`last_modified_date`, '%Y-%m-%d') AS `last_modified_date`,
        CONCAT(`m2`.`first_name`, ' ', `m2`.`last_name`) AS `last_modified_by`
    FROM
        (((((`job` `j`
        LEFT JOIN `member` `m` ON ((`m`.`member_id` = `j`.`member_id`) AND (`m`.`tenant_id` = `j`.`tenant_id`)))
        LEFT JOIN `member` `m2` ON ((`m2`.`member_id` = `j`.`last_modified_by`) AND (`m2`.`tenant_id` = `j`.`tenant_id`)))
        LEFT JOIN `event` `e` ON ((`e`.`event_id` = `j`.`event_id`)) AND (`e`.`tenant_id` = `j`.`tenant_id`)))
        LEFT JOIN `job_type` `jt` ON ((`j`.`job_type_id` = `jt`.`job_type_id`)) AND (`jt`.`tenant_id` = `j`.`tenant_id`))
        LEFT JOIN `paid_labor` `pl` ON ((`j`.`paid_labor_id` = `pl`.`paid_labor_id`)) AND (`pl`.`tenant_id` = `j`.`tenant_id`)
        
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.raw(`drop procedure sp_event_job_generation`);
  await knex.schema.raw(`
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
		select job_type_id, count from event_job 
		where event_type_id = _event_type_id;
	
    DECLARE CONTINUE HANDLER
    FOR NOT FOUND SET finished = 1;
    
    ## Insert our new event and grab its ID
	INSERT INTO event(tenant_id, start_date, end_date, event_type_id, event_name, event_description, restrict_signups) VALUES (_tenant_id, _event_start_date, _event_end_date, _event_type_id, _event_name, _event_description, _restrict_signups);
    SELECT LAST_INSERT_ID() INTO _event_id;
    
    SELECT type INTO _event_type FROM event_type WHERE event_type_id = _event_type_id and tenant_id = _tenant_id;


    ## Open the cursor to start our job generation
    OPEN cursorEJ;
    getEventJob: LOOP
		FETCH cursorEJ INTO cur_job_type, cur_count;
		IF finished = 1 THEN 
			leave getEventJob;
		END IF;
        
        SET @K = 1; # This counter is to handle count from event_job
		lab1: REPEAT
        
        # Get the JobDayNumber(this was taken from Alan DB)
        SELECT job_day_number, start_time, end_time, point_value, cash_value INTO @JobDayNumber, @StartTime, @EndTime, @Points, @Cash FROM job_type WHERE job_type_id = cur_job_type and tenant_id = _tenant_id;

        SET @JobDayInterval = 0;
        # only Races get job days tied to them as they can be multi day.  Everything else is a single.
        if ((_event_type = 'Race')) THEN
            SET @JobDayInterval = @JobDayNumber - 5;
        END IF;
        if ((_event_type = 'Harescramble')) THEN
            SET @JobDayInterval = @JobDayNumber - 5;
        END IF;

        SET @JobDate = DATE_ADD(_event_start_date, interval @JobDayInterval DAY);
		SET @JobStart = cast(concat(@JobDate, 'T', @StartTime) as datetime);
		SET @JobEnd = cast(concat(@JobDate, 'T', @EndTime) as datetime);
		INSERT INTO job(event_id, tenant_id, job_type_id, job_start_date, job_end_date, verified, paid, points_awarded, cash_payout) VALUES
        (_event_id, _tenant_id, cur_job_type, IFNULL(@JobStart,IFNULL(@JobDate,null)), IFNULL(@JobEnd, IFNULL(@JobDate,null)), 0, 0, @Points, @Cash);
        Set @k = @k +1;
		UNTIL @K > cur_count END REPEAT lab1;
        
    END LOOP getEventJob;
    CLOSE cursorEJ;
    
END
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

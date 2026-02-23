create or replace view v_events_by_year as
select
tenant_id, year(start) event_year, event_type, count(*) event_count
from 
v_event
where 
start <= now()
group by 
year(start), event_type

DELIMITER $$
create trigger bookings_insert_userid_statusid BEFORE INSERT ON bookings
for each row
BEGIN
DECLARE availableStatusId INT;
SET availableStatusId =  (SELECT id from Statuses where status = "Available");
IF NEW.StatusId != availableStatusId or NEW.UserId is not null
THEN
SIGNAL SQLSTATE '02000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! Add new booking time.';
END IF;

END$$

DELIMITER ;
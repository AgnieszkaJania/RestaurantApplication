DELIMITER $$
create trigger bookings_update_userid_statusid BEFORE UPDATE ON bookings
for each row
BEGIN
DECLARE availableStatusId INT;
DECLARE disabledStatusId INT;
DECLARE bookedStatusId INT;
SET availableStatusId =  (SELECT id from Statuses where status = "Available");
SET disabledStatusId =  (SELECT id from Statuses where status = "Disabled");
SET bookedStatusId =  (SELECT id from Statuses where status = "Booked");
IF NEW.StatusId = availableStatusId and NEW.UserId is not null
THEN
SIGNAL SQLSTATE '02000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! Status:Available.';
END IF;
IF NEW.StatusId = disabledStatusId and NEW.UserId is not null
THEN
SIGNAL SQLSTATE '02000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! Status:Disabled.';
END IF;
IF NEW.StatusId = bookedStatusId and NEW.UserId is null
THEN
SIGNAL SQLSTATE '02000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! Status:Booked.';
END IF;

END$$

DELIMITER ;
DELIMITER $$
create trigger bookings_update_userid_statusid BEFORE UPDATE ON bookings
for each row
BEGIN
DECLARE availableStatusId INT;
DECLARE disabledStatusId INT;
DECLARE bookedStatusId INT;
DECLARE deletedStatusId INT;
SET availableStatusId =  (SELECT id from Statuses where status = "Available");
SET disabledStatusId =  (SELECT id from Statuses where status = "Disabled");
SET bookedStatusId =  (SELECT id from Statuses where status = "Booked");
SET deletedStatusId =  (SELECT id from Statuses where status = "Deleted");
IF NEW.StatusId = availableStatusId and NEW.UserId is not null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! User has to be null. Status:Available.';
END IF;
IF  NEW.StatusId = availableStatusId and NEW.PIN is not null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! PIN has to be null. Status:Available.';
END IF;
IF NEW.StatusId = disabledStatusId and NEW.UserId is not null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! User has to be null. Status:Disabled.';
END IF;
IF NEW.StatusId = disabledStatusId and NEW.PIN is not null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! PIN has to be null. Status:Disabled.';
END IF;
IF NEW.StatusId = bookedStatusId and NEW.UserId is null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! User can not be null. Status:Booked.';
END IF;
IF NEW.StatusId = bookedStatusId and NEW.PIN is null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! PIN can not be null. Status:Booked.';
END IF;
IF NEW.StatusId = deletedStatusId and NEW.UserId is not null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! User has to be null. Status:Deleted.';
END IF;
IF NEW.StatusId = deletedStatusId and NEW.PIN is not null
THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attempt to insert inconsistent data! PIN has to be null. Status:Deleted.';
END IF;

END$$

DELIMITER ;
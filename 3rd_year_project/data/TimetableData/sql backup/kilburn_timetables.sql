CREATE DATABASE IF NOT EXISTS `kilburn_timetables`;

CREATE TABLE IF NOT EXISTS `activities` (
  `activity_id` int(255) NOT NULL AUTO_INCREMENT,
  `activity_name` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `week_day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  PRIMARY KEY (`activity_id`)
);

CREATE TABLE IF NOT EXISTS `rooms` (
  `room_id` int(255) NOT NULL AUTO_INCREMENT,
  `room_name` varchar(255) NOT NULL UNIQUE,
  `size` int(255) NOT NULL,
  PRIMARY KEY (`room_id`)
);

CREATE TABLE IF NOT EXISTS `timetables` (
  `room_id` int(255) NOT NULL,
  `activity_id` int(255) NOT NULL,
  `week_number` int(255) NOT NULL,
  PRIMARY KEY (`room_id`, `activity_id`, `week_number`),
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`),
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`activity_id`)
)

CREATE TABLE IF NOT EXISTS `DBmappings` (
                `mapping_id` int(255) NOT NULL AUTO_INCREMENT,
                `room_name` varchar(255) NOT NULL UNIQUE,
                `room_db_name` varchar(255) NOT NULL,
                PRIMARY KEY (`mapping_id`)
            );
			


--- DELETE ---
DELETE FROM `timetables`;
DELETE FROM `activities`;
DELETE FROM `rooms`;
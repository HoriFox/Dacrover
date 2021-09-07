DROP DATABASE IF EXISTS `dacrover`;
CREATE DATABASE `dacrover`;
USE `dacrover`;

DROP TABLE IF EXISTS `modules`;
CREATE TABLE `modules` (
  `ModuleId` int(11) NOT NULL AUTO_INCREMENT,
  `ModuleName` text DEFAULT NULL COMMENT 'Название модуля',
  `ModuleUser` text DEFAULT NULL COMMENT 'Имя пользователя',
  `ModuleType` text DEFAULT NULL COMMENT 'Тип модуля',
  `ModuleIp` text DEFAULT NULL COMMENT 'IP модуля',
  `MapData` text DEFAULT NULL COMMENT 'Данные модуля на карте',
  `ChangeTime` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ModuleId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COMMENT='Модули умного дома';


LOCK TABLES `modules` WRITE;
INSERT INTO `modules` VALUES (1,'Тестовая лампа','Комната Тагир','Реле-свет','192.168.1.50','72|91|coral','2020-10-29 22:03:40'),(2,'Тестовый стенд','Комната Тагир','Реле-розетка','192.168.1.51','355|186|cadetblue','2020-10-29 22:03:58'),(3,'Температура за окном','Кухня','Датчик температуры','192.168.1.53','339|290|cornflowerblue','2020-10-29 22:04:12');
UNLOCK TABLES;


DROP TABLE IF EXISTS `plans`;
CREATE TABLE `plans` (
  `PlanId` int(11) NOT NULL AUTO_INCREMENT,
  `PlanDisc` text DEFAULT NULL COMMENT 'Название плана',
  `ModuleIp` text DEFAULT NULL COMMENT 'IP управляемого модуля',
  `PlanDays` text DEFAULT NULL COMMENT 'Дни недели',
  `PlanTime` text DEFAULT NULL COMMENT 'Время дня',
  `ChangeTime` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`PlanId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COMMENT='Планы задач умного дома';

LOCK TABLES `plans` WRITE;
INSERT INTO `plans` VALUES (1,'Период работы тестовой лампы','192.168.1.53','ПН ВТ СР ЧТ ПТ СБ ВС','21:27 21:28','2020-10-31 18:29:12'),(2,'Период работы тестового стенда','192.168.1.53','ПН СР ЧТ ПТ СБ ВС','21:31 21:32','2020-10-30 18:27:29');
UNLOCK TABLES;


DROP TABLE IF EXISTS `reminders`;
CREATE TABLE `reminders` (
  `ReminderId` int(11) NOT NULL AUTO_INCREMENT,
  `ReminderUser` text DEFAULT NULL COMMENT 'Имя пользователя',
  `ReminderDisc` text DEFAULT NULL COMMENT 'Описание списка напоминания',
  `ReminderList` text DEFAULT NULL COMMENT 'Список напоминания через разделитель',
  `ChangeTime` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ReminderId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='Пользовательские напоминания';

LOCK TABLES `reminders` WRITE;
INSERT INTO `reminders` VALUES (1,'Тагир','Список для Тагира','Дело1[DEL]Дело2[DEL]Дело3','2021-09-07 18:29:12');
UNLOCK TABLES;


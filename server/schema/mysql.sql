-- V1.0 bootstrap schema for local Docker MySQL development.
-- The migration script `npm run db:migrate:mysql` introspects the live SQLite
-- schema and creates the canonical MySQL tables before importing data.

CREATE DATABASE IF NOT EXISTS `szht_cms`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `szht_cms`;

CREATE TABLE IF NOT EXISTS `migration_runs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `source_client` varchar(32) NOT NULL,
  `target_client` varchar(32) NOT NULL,
  `started_at` bigint NOT NULL,
  `finished_at` bigint DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `summary_json` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

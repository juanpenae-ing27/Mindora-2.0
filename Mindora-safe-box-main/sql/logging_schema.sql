-- Esquema sugerido para MySQL Workbench (aún no aplicado)
CREATE DATABASE IF NOT EXISTS mindora CHARACTER SET utf8mb4;
USE mindora;

CREATE TABLE IF NOT EXISTS logs (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  created_at  DATETIME(3)  NOT NULL,
  level       ENUM('DEBUG','INFO','WARN','ERROR') NOT NULL,
  event       VARCHAR(100) NOT NULL,
  message     TEXT,
  context     JSON NULL,
  page        VARCHAR(255),
  user_agent  VARCHAR(500),
  INDEX idx_level (level),
  INDEX idx_event (event),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- La API (POST /api/logs, body {"logs":[...]}) debe insertar cada entrada
-- con INSERT ... ON DUPLICATE KEY UPDATE id = id para ser idempotente.

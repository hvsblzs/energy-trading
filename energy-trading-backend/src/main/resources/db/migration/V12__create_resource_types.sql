CREATE TABLE resource_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO resource_types (name, unit) VALUES ('GAS', 'm3');
INSERT INTO resource_types (name, unit) VALUES ('ELECTRICITY', 'kWh');
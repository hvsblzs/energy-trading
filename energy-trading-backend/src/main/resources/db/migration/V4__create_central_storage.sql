CREATE TABLE central_storage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_type ENUM('GAS', 'ELECTRICITY') NOT NULL UNIQUE,
    quantity DECIMAL(19,4) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO central_storage (resource_type, quantity, unit) VALUES ('GAS', 0, 'm3');
INSERT INTO central_storage (resource_type, quantity, unit) VALUES ('ELECTRICITY', 0, 'kWh');
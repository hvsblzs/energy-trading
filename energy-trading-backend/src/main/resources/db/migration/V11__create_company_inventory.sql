CREATE TABLE company_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    resource_type ENUM('GAS', 'ELECTRICITY') NOT NULL,
    quantity DECIMAL(19,4) NOT NULL DEFAULT 0,
    CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uq_company_inventory UNIQUE (company_id, resource_type)
);
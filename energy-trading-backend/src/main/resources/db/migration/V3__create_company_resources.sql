CREATE TABLE company_resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    resource_type ENUM('GAS', 'ELECTRICITY') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_cr_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uq_company_resource UNIQUE (company_id, resource_type)
);
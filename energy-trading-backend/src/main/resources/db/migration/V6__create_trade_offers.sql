CREATE TABLE trade_offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    resource_type ENUM('GAS', 'ELECTRICITY') NOT NULL,
    offer_type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(19,4) NOT NULL,
    price_per_unit DECIMAL(19,4) NOT NULL,
    total_price DECIMAL(19,4) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by_user_id BIGINT NULL,
    notes TEXT NULL,
    CONSTRAINT fk_offer_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_offer_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);
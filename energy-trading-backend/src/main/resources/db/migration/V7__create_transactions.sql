CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trade_offer_id BIGINT NOT NULL,
    resource_type ENUM('GAS', 'ELECTRICITY') NOT NULL,
    quantity DECIMAL(19,4) NOT NULL,
    credit_amount DECIMAL(19,4) NOT NULL,
    direction ENUM('COMPANY_TO_CENTRAL', 'CENTRAL_TO_COMPANY') NOT NULL,
    company_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_offer FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id),
    CONSTRAINT fk_tx_company FOREIGN KEY (company_id) REFERENCES companies(id)
);
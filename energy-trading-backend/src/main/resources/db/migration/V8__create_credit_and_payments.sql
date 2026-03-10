CREATE TABLE credit_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    type ENUM('TRADE', 'TOPUP', 'INITIAL') NOT NULL,
    reference_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ct_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    stripe_payment_id VARCHAR(255) NULL,
    amount_paid DECIMAL(19,4) NOT NULL,
    credits_received DECIMAL(19,4) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_company FOREIGN KEY (company_id) REFERENCES companies(id)
);
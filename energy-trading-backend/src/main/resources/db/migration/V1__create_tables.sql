-- V1__create_tables.sql

CREATE TABLE companies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL UNIQUE,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    credit_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'DISPATCHER', 'COMPANY_USER') NOT NULL,
    company_id BIGINT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    credit_balance DECIMAL(19,4) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE resource_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#10b981',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE central_storage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_type_id BIGINT NOT NULL,
    quantity DECIMAL(19,4) NOT NULL DEFAULT 0,
    max_quantity DECIMAL(19,4) NOT NULL DEFAULT 10000,
    unit VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cs_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id)
);

CREATE TABLE pricing (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_type_id BIGINT NOT NULL,
    buy_price DECIMAL(19,4) NOT NULL,
    sell_price DECIMAL(19,4) NOT NULL,
    set_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pricing_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id),
    CONSTRAINT fk_pricing_user FOREIGN KEY (set_by_user_id) REFERENCES users(id)
);

CREATE TABLE trade_offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    resource_type_id BIGINT NOT NULL,
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
    CONSTRAINT fk_offer_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_to_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id)
);

CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trade_offer_id BIGINT NOT NULL,
    resource_type_id BIGINT NOT NULL,
    quantity DECIMAL(19,4) NOT NULL,
    credit_amount DECIMAL(19,4) NOT NULL,
    direction ENUM('COMPANY_TO_CENTRAL', 'CENTRAL_TO_COMPANY') NOT NULL,
    company_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_offer FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id),
    CONSTRAINT fk_tx_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_tx_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id)
);

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

CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id BIGINT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE company_resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    resource_type_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_cr_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_cr_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id),
    CONSTRAINT uq_company_resource UNIQUE (company_id, resource_type_id)
);

CREATE TABLE company_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    resource_type_id BIGINT NOT NULL,
    quantity DECIMAL(19,4) NOT NULL DEFAULT 0,
    CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_ci_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id),
    CONSTRAINT uq_company_inventory UNIQUE (company_id, resource_type_id)
);
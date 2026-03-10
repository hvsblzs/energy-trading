CREATE TABLE pricing (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_type ENUM('GAS', 'ELECTRICITY') NOT NULL,
    buy_price DECIMAL(19, 4) NOT NULL,
    sell_price DECIMAL(19, 4) NOT NULL,
    set_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pricing_user FOREIGN KEY (set_by_user_id) REFERENCES users(id)
);
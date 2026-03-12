-- V2__seed_data.sql

-- Resource types
INSERT INTO resource_types (name, unit, color) VALUES ('GAS', 'm3', '#f59e0b');
INSERT INTO resource_types (name, unit, color) VALUES ('ELECTRICITY', 'kWh', '#3b82f6');

-- Admin user
INSERT INTO users (email, password_hash, role) VALUES (
    'admin@energytrading.com',
    '$2a$10$n8RmZf8cuCVNDT9uChrIsuGKyNCxqui2Gx6ovNzr.DJO4QqDaFToK',
    'ADMIN'
);

-- Dispatcher user
INSERT INTO users (email, password_hash, role, credit_balance) VALUES (
    'dispatcher@energytrading.com',
    '$2a$10$IEPL9D7OMWO8IWciJFfG/uwqYoi2xD8OnzfS3eDm69Elkgbj9ytMa',
    'DISPATCHER',
    0
);

-- Central storage
INSERT INTO central_storage (resource_type_id, quantity, max_quantity, unit)
VALUES ((SELECT id FROM resource_types WHERE name = 'GAS'), 0, 10000, 'm3');
INSERT INTO central_storage (resource_type_id, quantity, max_quantity, unit)
VALUES ((SELECT id FROM resource_types WHERE name = 'ELECTRICITY'), 0, 10000, 'kWh');

-- Initial pricing (dispatcher user sets the prices)
INSERT INTO pricing (resource_type_id, buy_price, sell_price, set_by_user_id)
VALUES ((SELECT id FROM resource_types WHERE name = 'GAS'), 100, 120, (SELECT id FROM users WHERE email = 'dispatcher@energytrading.com'));
INSERT INTO pricing (resource_type_id, buy_price, sell_price, set_by_user_id)
VALUES ((SELECT id FROM resource_types WHERE name = 'ELECTRICITY'), 150, 180, (SELECT id FROM users WHERE email = 'dispatcher@energytrading.com'));
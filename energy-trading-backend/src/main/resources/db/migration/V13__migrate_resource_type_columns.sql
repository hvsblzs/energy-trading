-- Central Storage
ALTER TABLE central_storage ADD COLUMN resource_type_id BIGINT;
UPDATE central_storage SET resource_type_id = (SELECT id FROM resource_types WHERE name = resource_type);
ALTER TABLE central_storage DROP COLUMN resource_type;
ALTER TABLE central_storage ADD CONSTRAINT fk_cs_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
ALTER TABLE central_storage MODIFY resource_type_id BIGINT NOT NULL;

-- Pricing
ALTER TABLE pricing ADD COLUMN resource_type_id BIGINT;
UPDATE pricing SET resource_type_id = (SELECT id FROM resource_types WHERE name = resource_type);
ALTER TABLE pricing DROP COLUMN resource_type;
ALTER TABLE pricing ADD CONSTRAINT fk_pricing_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
ALTER TABLE pricing MODIFY resource_type_id BIGINT NOT NULL;

-- Trade Offers
ALTER TABLE trade_offers ADD COLUMN resource_type_id BIGINT;
UPDATE trade_offers SET resource_type_id = (SELECT id FROM resource_types WHERE name = resource_type);
ALTER TABLE trade_offers DROP COLUMN resource_type;
ALTER TABLE trade_offers ADD CONSTRAINT fk_to_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
ALTER TABLE trade_offers MODIFY resource_type_id BIGINT NOT NULL;

-- Company Resources
ALTER TABLE company_resources ADD COLUMN resource_type_id BIGINT;
UPDATE company_resources SET resource_type_id = (SELECT id FROM resource_types WHERE name = resource_type);
ALTER TABLE company_resources DROP COLUMN resource_type;
ALTER TABLE company_resources ADD CONSTRAINT fk_cr_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
ALTER TABLE company_resources MODIFY resource_type_id BIGINT NOT NULL;

-- Company Inventory
ALTER TABLE company_inventory ADD COLUMN resource_type_id BIGINT;
UPDATE company_inventory SET resource_type_id = (SELECT id FROM resource_types WHERE name = resource_type);
ALTER TABLE company_inventory DROP COLUMN resource_type;
ALTER TABLE company_inventory ADD CONSTRAINT fk_ci_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
ALTER TABLE company_inventory MODIFY resource_type_id BIGINT NOT NULL;

-- Transactions
ALTER TABLE transactions ADD COLUMN resource_type_id BIGINT;
UPDATE transactions SET resource_type_id = (SELECT id FROM resource_types WHERE name = resource_type);
ALTER TABLE transactions DROP COLUMN resource_type;
ALTER TABLE transactions ADD CONSTRAINT fk_tx_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
ALTER TABLE transactions MODIFY resource_type_id BIGINT NOT NULL;
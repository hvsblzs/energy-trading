ALTER TABLE company_inventory DROP FOREIGN KEY fk_inventory_company;
ALTER TABLE company_inventory DROP FOREIGN KEY fk_ci_resource_type;
ALTER TABLE company_inventory DROP INDEX uq_company_inventory;
ALTER TABLE company_inventory ADD CONSTRAINT uq_company_inventory UNIQUE (company_id, resource_type_id);
ALTER TABLE company_inventory ADD CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE company_inventory ADD CONSTRAINT fk_ci_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
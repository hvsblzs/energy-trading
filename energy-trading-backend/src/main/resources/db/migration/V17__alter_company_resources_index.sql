ALTER TABLE company_resources DROP INDEX uq_company_resource;
ALTER TABLE company_resources ADD CONSTRAINT uq_company_resource UNIQUE (company_id, resource_type_id);
ALTER TABLE company_resources ADD CONSTRAINT fk_cr_company FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE company_resources ADD CONSTRAINT fk_cr_resource_type FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);
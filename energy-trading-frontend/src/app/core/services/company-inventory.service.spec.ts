import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyInventoryService } from './company-inventory.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('CompanyInventoryService', () => {
  let service: CompanyInventoryService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyInventoryService]
    });

    service = TestBed.inject(CompanyInventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── getMyInventory tesztek ────────────────────────────

  it('should call GET /company-inventory/me', () => {
    const mockInventory = [
      { id: 1, resourceTypeName: 'GAS', resourceTypeUnit: 'm3', quantity: 200, active: true },
      { id: 2, resourceTypeName: 'ELECTRICITY', resourceTypeUnit: 'kWh', quantity: 500, active: true }
    ];

    service.getMyInventory().subscribe(inventory => {
      expect(inventory).toEqual(mockInventory);
      expect(inventory.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/company-inventory/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockInventory);
  });

  it('should return empty array when no inventory items', () => {
    service.getMyInventory().subscribe(inventory => {
      expect(inventory).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/company-inventory/me`);
    req.flush([]);
  });

  it('should return inventory with inactive items', () => {
    const mockInventory = [
      { id: 1, resourceTypeName: 'GAS', quantity: 200, active: false }
    ];

    service.getMyInventory().subscribe(inventory => {
      expect(inventory[0].active).toBe(false);
    });

    const req = httpMock.expectOne(`${apiUrl}/company-inventory/me`);
    req.flush(mockInventory);
  });
  
});
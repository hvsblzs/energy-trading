import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResourceTypeService } from './resource-type.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('ResourceTypeService', () => {
  let service: ResourceTypeService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResourceTypeService]
    });

    service = TestBed.inject(ResourceTypeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // getAllResourceTypes tesztek

  it('should call GET /resource-types', () => {
    const mockResourceTypes = [
      { id: 1, name: 'GAS', unit: 'm3', color: '#10b981', active: true },
      { id: 2, name: 'ELECTRICITY', unit: 'kWh', color: '#3b82f6', active: true }
    ];

    service.getAllResourceTypes().subscribe(resourceTypes => {
      expect(resourceTypes).toEqual(mockResourceTypes);
      expect(resourceTypes.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/resource-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResourceTypes);
  });

  it('should return empty array when no resoure types', () => {
    service.getAllResourceTypes().subscribe(resourceTypes => {
      expect(resourceTypes).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/resource-types`);
    req.flush([]);
  });

  // createResourceType tesztek

  it('should call POST /resource-types with request body', () => {
    const request = {
      name: 'WATER',
      unit: 'L',
      color: '#6366f1',
      buyPrice: 10,
      sellPrice: 8
    };
    const mockResponse = { id: 3, ...request, active: true };

    service.createResourceType(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/resource-types`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should call POST /resource-types and return created resource', () => {
    const request = { name: 'OIL', unit: 'L', buyPrice: 200, sellPrice: 180 };

    service.createResourceType(request).subscribe(response => {
      expect(response.name).toBe('OIL')
    });

    const req = httpMock.expectOne(`${apiUrl}/resource-types`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 4, ...request, active: true });
  });

  // deleteResourceType tesztek

  it('should call DELETE /resource-types/:id', () => {
    service.deleteResourceType(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/resource-types/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should call correct URL for different resource type ids', () => {
    service.deleteResourceType(42).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/resource-types/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

})
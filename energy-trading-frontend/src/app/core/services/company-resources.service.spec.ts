import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyResourcesService } from './company-resources.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('CompanyResourcesService', () => {
  let service: CompanyResourcesService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyResourcesService]
    });

    service = TestBed.inject(CompanyResourcesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // getMyResources tesztek

  it('should call GET /company-resources/me', () => {
    const mockResources = [
      { id: 1, resourceTypeName: 'GAS', resourceTypeUnit: 'm3', active: true },
      { id: 2, resourceTypeName: 'ELECTRICITY', resourceTypeUnit: 'kWh', active: true }
    ];

    service.getMyResources().subscribe(resources => {
      expect(resources).toEqual(mockResources);
      expect(resources.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/company-resources/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResources);
  });

  it('should return empty array when no resources', () => {
    service.getMyResources().subscribe(resources => {
      expect(resources).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/company-resources/me`);
    req.flush([]);
  });

  // getResourcesByCompany tesztek

  it('should call GET /company-resources/company/:companyId', () => {
    const mockResources = [
      { id: 1, resourceTypeName: 'GAS', active: true }
    ];

    service.getResourcesByCompany(1).subscribe(resources => {
      expect(resources).toEqual(mockResources);
    });

    const req = httpMock.expectOne(`${apiUrl}/company-resources/company/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResources);
  });

  it('should call correct URL for different company ids', () => {
    service.getResourcesByCompany(42).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/company-resources/company/42`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // addResource tesztek

  it('should call POST /company-resources/company/:companyId/resource/:resourceTypeId', () => {
    service.addResource(1, 2).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/company-resources/company/1/resource/2`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('should call correct URL for different ids in addResource', () => {
    service.addResource(5, 10).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/company-resources/company/5/resource/10`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  // removeResource tesztek

  it('should call DELETE /company-resources/company/:companyId/resource/:resourceTypeId', () => {
    service.removeResource(1, 2).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/company-resources/company/1/resource/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should call correct URL for different ids in removeResource', () => {
    service.removeResource(5, 10).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/company-resources/company/5/resource/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
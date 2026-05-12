import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyService } from './company.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { PRIMARY_OUTLET } from '@angular/router';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyService]
    });

    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // getAllCompanies tesztek

  it('should call GET /companies with default params', () => {
    service.getAllCompanies().subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/companies`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('name');
    expect(req.request.params.get('direction')).toBe('asc');
    req.flush({ content: [], totalElements: 0});
  });

  it('should call GET /companies with custom params', () => {
    service.getAllCompanies({ page: 1, size: 5, sort: 'createdAt', direction: 'desc', search: 'test' }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/companies`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.get('sort')).toBe('createdAt');
    expect(req.request.params.get('direction')).toBe('desc');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ content: [], totalElements: 0});
  });

  it('should include active param when provided', () => {
    service.getAllCompanies({active: false}).subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/companies`);
    expect(req.request.params.get('active')).toBe('false');
    req.flush({ content: [], totalElements: 0});
  });

  it('should not include active params when null', () => {
    service.getAllCompanies({active: null}).subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/companies`);
    expect(req.request.params.get('active')).toBeNull();
    req.flush({ content: [], totalElements: 0});
  });

  // getCompanyById tesztek

  it('should call GET /companies/:id', () => {
    const mockCompany = { id: 1, name: 'Test Co', email: 'test@co.com'};

    service.getCompanyById(1).subscribe(company => {
      expect(company).toEqual(mockCompany);
    });

    const req = httpMock.expectOne(`${apiUrl}/companies/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCompany);
  });

  // createCompany tesztek

  it('should call POST /companies with request body', () => {
    const request = { name: 'New Co', email: 'new@co.com'};
    const mockResponse = { id: 1, ...request};

    service.createCompany(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/companies`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  // updateCompany tesztek

  it('should call PUT /companies/:id with request body', () => {
    const request = { name: 'Updated Co', email: 'updated@co.com'};

    service.updateCompany(1, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/companies/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  // activateCompany / deactivateCompany tesztek

  it('should call PATCH /companies/:id/activate', () => {
    service.activateCompany(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/companies/1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('should call PATCH /companies/:id/deactivate', () => {
    service.deactivateCompany(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/companies/1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  // createCompanyWithUser tesztek

  it('should call POST /companies/with-user with request body', () => {
    const request = {
      companyName: 'New Co',
      companyEmail: 'new@co.com',
      userEmail: 'user@new.com',
      password: 'pass123'
    };
    const mockResponse = {id: 1, name: 'New Co'};

    service.createCompanyWithUser(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/companies/with-user`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  // deleteCompany tesztek

  it('should call DELETE /companies/:id', () => {
    service.deleteCompany(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/companies/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

});
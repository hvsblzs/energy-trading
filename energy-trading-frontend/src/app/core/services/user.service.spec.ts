import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── creditBalance$ tesztek ────────────────────────────

  it('should initialize creditBalance$ with null', () => {
    expect(service.creditBalance$.getValue()).toBeNull();
  });

  it('should update creditBalance$ when updateCreditBalance is called', () => {
    service.updateCreditBalance(5000);
    expect(service.creditBalance$.getValue()).toBe(5000);
  });

  it('should emit new value when updateCreditBalance is called multiple times', () => {
    service.updateCreditBalance(1000);
    service.updateCreditBalance(2000);
    expect(service.creditBalance$.getValue()).toBe(2000);
  });

  // ── getMe tesztek ─────────────────────────────────────

  it('should call GET /users/me', () => {
    const mockUser = { id: 1, email: 'test@test.com', role: 'DISPATCHER' };

    service.getMe().subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(`${apiUrl}/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  // ── getAllUsers tesztek ────────────────────────────────

  it('should call GET /users with default params', () => {
    service.getAllUsers().subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('email');
    expect(req.request.params.get('direction')).toBe('asc');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should call GET /users with custom params', () => {
    service.getAllUsers({ page: 2, size: 5, sort: 'createdAt', direction: 'desc', search: 'test' }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/users`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.get('sort')).toBe('createdAt');
    expect(req.request.params.get('direction')).toBe('desc');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should include active param when provided', () => {
    service.getAllUsers({ active: true }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/users`);
    expect(req.request.params.get('active')).toBe('true');
    req.flush({ content: [], totalElements: 0 });
  });

  // ── createUser tesztek ────────────────────────────────

  it('should call POST /users with request body', () => {
    const request = { email: 'new@test.com', password: 'pass123', role: 'DISPATCHER' };
    const mockResponse = { id: 1, ...request };

    service.createUser(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  // ── updateUser tesztek ────────────────────────────────

  it('should call PUT /users/:id with request body', () => {
    const request = { email: 'updated@test.com', role: 'DISPATCHER' };

    service.updateUser(1, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  // ── activateUser / deactivateUser tesztek ─────────────

  it('should call PATCH /users/:id/activate', () => {
    service.activateUser(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('should call PATCH /users/:id/deactivate', () => {
    service.deactivateUser(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  // ── createUserForCompany tesztek ──────────────────────

  it('should call POST /users/companies/:companyId/users', () => {
    const request = { email: 'company@test.com', password: 'pass123' };

    service.createUserForCompany(5, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/companies/5/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  // ── getUsersByCompany tesztek ─────────────────────────

  it('should call GET /users/companies/:companyId', () => {
    const mockUsers = [{ id: 1, email: 'user@test.com' }];

    service.getUsersByCompany(5).subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${apiUrl}/users/companies/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  // ── resetPassword tesztek ─────────────────────────────

  it('should call PATCH /users/:id/reset-password with new password', () => {
    service.resetPassword(1, 'newpassword123').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/1/reset-password`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ newPassword: 'newpassword123' });
    req.flush(null);
  });
});
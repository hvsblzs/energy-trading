import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    // localStorage tisztítása minden teszt előtt
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify(); // ellenőrzi hogy nincs nyitott HTTP kérés
    localStorage.clear();
  });

  // ── login tesztek ─────────────────────────────────────

  it('should call login endpoint with correct data', () => {
    const mockResponse = { token: 'test-token', role: 'DISPATCHER' };

    service.login('test@test.com', 'password123').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com', password: 'password123' });
    req.flush(mockResponse);
  });

  // ── saveToken tesztek ─────────────────────────────────

  it('should save token, role and userId to localStorage', () => {
    service.saveToken('my-token', 'DISPATCHER', 1, null);

    expect(localStorage.getItem('token')).toBe('my-token');
    expect(localStorage.getItem('role')).toBe('DISPATCHER');
    expect(localStorage.getItem('userId')).toBe('1');
    expect(localStorage.getItem('companyId')).toBeNull();
  });

  it('should save companyId to localStorage when provided', () => {
    service.saveToken('my-token', 'COMPANY_USER', 2, 5);

    expect(localStorage.getItem('companyId')).toBe('5');
  });

  it('should not save companyId when null', () => {
    service.saveToken('my-token', 'DISPATCHER', 1, null);

    expect(localStorage.getItem('companyId')).toBeNull();
  });

  // ── getToken tesztek ──────────────────────────────────

  it('should return token from localStorage', () => {
    localStorage.setItem('token', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return null when no token in localStorage', () => {
    expect(service.getToken()).toBeNull();
  });

  // ── getRole tesztek ───────────────────────────────────

  it('should return role from localStorage', () => {
    localStorage.setItem('role', 'DISPATCHER');
    expect(service.getRole()).toBe('DISPATCHER');
  });

  it('should return null when no role in localStorage', () => {
    expect(service.getRole()).toBeNull();
  });

  // ── getCompanyId tesztek ──────────────────────────────

  it('should return companyId as number from localStorage', () => {
    localStorage.setItem('companyId', '5');
    expect(service.getCompanyId()).toBe(5);
  });

  it('should return null when no companyId in localStorage', () => {
    expect(service.getCompanyId()).toBeNull();
  });

  // ── isLoggedIn tesztek ────────────────────────────────

  it('should return true when token exists', () => {
    localStorage.setItem('token', 'test-token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should return false when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  // ── getUserId tesztek ─────────────────────────────────

  it('should return userId from JWT token payload', () => {
    // JWT token: header.payload.signature
    // payload: { userId: 42 }
    const payload = btoa(JSON.stringify({ userId: 42 }));
    const token = `header.${payload}.signature`;
    localStorage.setItem('token', token);

    expect(service.getUserId()).toBe(42);
  });

  it('should return null when no token for getUserId', () => {
    expect(service.getUserId()).toBeNull();
  });

  it('should return null when token is malformed', () => {
    localStorage.setItem('token', 'invalid-token');
    expect(service.getUserId()).toBeNull();
  });

  // ── logout tesztek ────────────────────────────────────

  it('should clear localStorage on logout', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('role', 'DISPATCHER');

    const navigateSpy = vi.spyOn(router, 'navigate');
    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
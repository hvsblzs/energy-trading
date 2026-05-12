import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransactionService]
    });

    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── getRecentTransactions tesztek ─────────────────────

  it('should call GET /transactions/recent', () => {
    const mockTransactions = [
      { id: 1, companyName: 'Test Co', resourceType: 'GAS', quantity: 10, creditAmount: 900 },
      { id: 2, companyName: 'Other Co', resourceType: 'ELECTRICITY', quantity: 50, creditAmount: 2500 }
    ];

    service.getRecentTransactions().subscribe(transactions => {
      expect(transactions).toEqual(mockTransactions);
      expect(transactions.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/transactions/recent`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTransactions);
  });

  it('should return empty array when no recent transactions', () => {
    service.getRecentTransactions().subscribe(transactions => {
      expect(transactions).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/transactions/recent`);
    req.flush([]);
  });

  // ── getStats tesztek ──────────────────────────────────

  it('should call GET /transactions/stats with DAILY period', () => {
    const mockStats = {
      period: 'DAILY',
      totalCreditVolume: 5000,
      resourceStats: [
        { resourceType: 'GAS', totalQuantity: 100, totalCredit: 5000 }
      ]
    };

    service.getStats('DAILY').subscribe(stats => {
      expect(stats).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${apiUrl}/transactions/stats?period=DAILY`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should call GET /transactions/stats with WEEKLY period', () => {
    const mockStats = {
      period: 'WEEKLY',
      totalCreditVolume: 25000,
      resourceStats: []
    };

    service.getStats('WEEKLY').subscribe(stats => {
      expect(stats).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${apiUrl}/transactions/stats?period=WEEKLY`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should call correct URL with period parameter', () => {
    service.getStats('DAILY').subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/transactions/stats') && r.urlWithParams.includes('period=DAILY')
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
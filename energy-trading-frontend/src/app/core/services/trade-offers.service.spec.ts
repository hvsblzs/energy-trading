import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TradeOfferService } from './trade-offers.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('TradeOfferService', () => {
  let service: TradeOfferService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TradeOfferService]
    });

    service = TestBed.inject(TradeOfferService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── createTradeOffer tesztek ──────────────────────────

  it('should call POST /trade-offers with request body', () => {
    const request = { resourceType: 'GAS', offerType: 'BUY', quantity: 10 };
    const mockResponse = { id: 1, ...request, status: 'PENDING' };

    service.createTradeOffer(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/trade-offers`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should call POST /trade-offers with SELL offer', () => {
    const request = { resourceType: 'ELECTRICITY', offerType: 'SELL', quantity: 50 };

    service.createTradeOffer(request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/trade-offers`);
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  // ── getPendingTradeOffers tesztek ─────────────────────

  it('should call GET /trade-offers/pending', () => {
    const mockOffers = [
      { id: 1, resourceType: 'GAS', offerType: 'BUY', status: 'PENDING' },
      { id: 2, resourceType: 'ELECTRICITY', offerType: 'SELL', status: 'PENDING' }
    ];

    service.getPendingTradeOffers().subscribe(offers => {
      expect(offers).toEqual(mockOffers);
      expect(offers.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/trade-offers/pending`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOffers);
  });

  it('should return empty array when no pending offers', () => {
    service.getPendingTradeOffers().subscribe(offers => {
      expect(offers).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/trade-offers/pending`);
    req.flush([]);
  });

  // ── approveTradeOffer tesztek ─────────────────────────

  it('should call PUT /trade-offers/:id/approve', () => {
    const mockResponse = { id: 1, status: 'COMPLETED' };

    service.approveTradeOffer(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/trade-offers/1/approve`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('should call correct URL for different trade offer ids', () => {
    service.approveTradeOffer(42).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/trade-offers/42/approve`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  // ── rejectTradeOffer tesztek ──────────────────────────

  it('should call PUT /trade-offers/:id/reject with notes', () => {
    const mockResponse = { id: 1, status: 'REJECTED', notes: 'Not enough stock' };

    service.rejectTradeOffer(1, 'Not enough stock').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/trade-offers/1/reject?notes=Not enough stock`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  // ── getTradeHistory tesztek ───────────────────────────

  it('should call GET /trade-offers/history with default params', () => {
    service.getTradeHistory({}).subscribe();

    const req = httpMock.expectOne(
      `${apiUrl}/trade-offers/history?page=0&size=10&sort=createdAt&direction=desc`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should call GET /trade-offers/history with custom params', () => {
    service.getTradeHistory({
      page: 1,
      size: 5,
      sort: 'totalPrice',
      direction: 'asc'
    }).subscribe();

    const req = httpMock.expectOne(
      `${apiUrl}/trade-offers/history?page=1&size=5&sort=totalPrice&direction=asc`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should include status filter in trade history', () => {
    service.getTradeHistory({ status: 'COMPLETED' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/trade-offers/history') && r.urlWithParams.includes('status=COMPLETED')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should include offerType filter in trade history', () => {
    service.getTradeHistory({ offerType: 'BUY' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/trade-offers/history') && r.urlWithParams.includes('offerType=BUY')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should include resourceType filter in trade history', () => {
    service.getTradeHistory({ resourceType: 'GAS' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/trade-offers/history') && r.urlWithParams.includes('resourceType=GAS')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should include search filter in trade history', () => {
    service.getTradeHistory({ search: 'test' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/trade-offers/history') && r.urlWithParams.includes('search=test')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });
});
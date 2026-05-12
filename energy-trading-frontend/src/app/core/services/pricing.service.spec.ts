import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PricingService } from './pricing.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('PricingService', () => {
  let service: PricingService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PricingService]
    });

    service = TestBed.inject(PricingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // getCurrentPrice tesztek

  it('should call GET /pricings/:resourceType', () => {
    const mockPrice = { id: 1, resourceType: 'GAS', buyPrice: 100, sellPrice: 90};

    service.getCurrentPrice('GAS').subscribe(price => {
      expect(price).toEqual(mockPrice);
    });

    const req = httpMock.expectOne(`${apiUrl}/pricings/GAS`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPrice);
  });

  it('should call corret URl for different resource types', () => {
    service.getCurrentPrice('ELECTRICITY').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/pricings/ELECTRICITY`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  // setPrice tesztek

  it('should call POST /pricings with request body', () => {
    const request = { resourceType: 'GAS', buyPrice: 150, sellPrice: 120};
    const mockResponse = { id: 1, ...request};

    service.setPrice(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/pricings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  // getAllPrices tesztek

  it('should call GET /pricings/all', () => {
    const mockPrices = [
      { id: 1, resourceType: 'GAS', buyPrice: 100, sellPrice: 90 },
      { id: 2, resourceType: 'ELECTRICITY', buyPrice: 50, sellPrice: 45 }
    ];

    service.getAllPrices().subscribe(prices => {
      expect(prices).toEqual(mockPrices);
      expect(prices.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/pricings/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPrices);
  });

  it('should return empty array when no prices', () => {
    service.getAllPrices().subscribe(prices => {
      expect(prices).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/pricings/all`);
    req.flush([]);
  });

  // getAllPricesForResourceType tesztek

  it('should call GET /pricings/:resourceType/price-history', () => {
    const mockHistory = [
      { buyPrice: 100, sellPrie: 90, createdAt: '2026-01-01T10:00:00' },
      { buyPrie: 120, sellPrice: 110, createdAt: '2026-01-02T10:00:00' }
    ];
    
    service.getAllPricesForResourceType('GAS').subscribe(history => {
      expect(history).toEqual(mockHistory);
      expect(history.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/pricings/GAS/price-history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);
  });

  it('should call correct URL for different resource types in price history', () => {
    service.getAllPricesForResourceType('ELECTRICITY').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/pricings/ELECTRICITY/price-history`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  })



})
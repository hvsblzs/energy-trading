import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });

    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── createPaymentIntent tesztek ───────────────────────

  it('should call POST /payments/create-payment-intent with amount', () => {
    const mockResponse = { clientSecret: 'pi_test_secret_123' };

    service.createPaymentIntent(5000).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/payments/create-payment-intent`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 5000 });
    req.flush(mockResponse);
  });

  it('should call POST with different amounts', () => {
    service.createPaymentIntent(10000).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/payments/create-payment-intent`);
    expect(req.request.body).toEqual({ amount: 10000 });
    req.flush({ clientSecret: 'pi_test_secret_456' });
  });

  it('should return clientSecret in response', () => {
    const mockResponse = { clientSecret: 'pi_test_secret_789' };

    service.createPaymentIntent(1000).subscribe(response => {
      expect(response.clientSecret).toBe('pi_test_secret_789');
    });

    const req = httpMock.expectOne(`${apiUrl}/payments/create-payment-intent`);
    req.flush(mockResponse);
  });
});
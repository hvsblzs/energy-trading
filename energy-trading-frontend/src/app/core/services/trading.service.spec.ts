import { TestBed } from '@angular/core/testing';
import { TradingService } from './trading.service';
import { PricingService } from './pricing.service';
import { TradeOfferService } from './trade-offers.service';
import { ToastService } from './toast.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

describe('TradingService', () => {
  let service: TradingService;
  let pricingServiceMock: any;
  let tradeOfferServiceMock: any;
  let toastServiceMock: any;

  beforeEach(() => {
    pricingServiceMock = {
      getCurrentPrice: vi.fn().mockReturnValue(of({}))
    };

    tradeOfferServiceMock = {
      createTradeOffer: vi.fn().mockReturnValue(of({}))
    };

    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TradingService,
        { provide: PricingService, useValue: pricingServiceMock },
        { provide: TradeOfferService, useValue: tradeOfferServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    });

    service = TestBed.inject(TradingService);
  });

  // ── kezdeti állapot tesztek ───────────────────────────

  it('should initialize with null currentPrice', () => {
    expect(service.currentPrice).toBeNull();
  });

  it('should initialize with false isSubmitting', () => {
    expect(service.isSubmitting).toBe(false);
  });

  it('should have onTradeSuccess$ subject', () => {
    expect(service.onTradeSuccess$).toBeDefined();
  });

  it('should have onTradeError$ subject', () => {
    expect(service.onTradeError$).toBeDefined();
  });

  // ── loadCurrentPrice tesztek ──────────────────────────

  it('should call pricingService.getCurrentPrice with resource type', () => {
    const mockPrice = { resourceType: 'GAS', buyPrice: 100, sellPrice: 90 };
    pricingServiceMock.getCurrentPrice.mockReturnValue(of(mockPrice));

    service.loadCurrentPrice('GAS').subscribe(price => {
      expect(price).toEqual(mockPrice);
    });

    expect(pricingServiceMock.getCurrentPrice).toHaveBeenCalledWith('GAS');
  });

  it('should call correct resource type in loadCurrentPrice', () => {
    service.loadCurrentPrice('ELECTRICITY').subscribe();

    expect(pricingServiceMock.getCurrentPrice).toHaveBeenCalledWith('ELECTRICITY');
  });

  // ── getCalculatedPrice tesztek ────────────────────────

  it('should calculate BUY price correctly', () => {
    const currentPrice = { buyPrice: 100, sellPrice: 90 };

    // BUY esetén a sellPrice-t használja
    const result = service.getCalculatedPrice('BUY', currentPrice, '10');

    expect(result).toBe(900); // 90 * 10
  });

  it('should calculate SELL price correctly', () => {
    const currentPrice = { buyPrice: 100, sellPrice: 90 };

    // SELL esetén a buyPrice-t használja
    const result = service.getCalculatedPrice('SELL', currentPrice, '10');

    expect(result).toBe(1000); // 100 * 10
  });

  it('should return 0 when currentPrice is null', () => {
    const result = service.getCalculatedPrice('BUY', null, '10');

    expect(result).toBe(0);
  });

  it('should return 0 when quantity is empty string', () => {
    const currentPrice = { buyPrice: 100, sellPrice: 90 };

    const result = service.getCalculatedPrice('BUY', currentPrice, '');

    expect(result).toBe(0);
  });

  it('should handle decimal quantity correctly', () => {
    const currentPrice = { buyPrice: 100, sellPrice: 90 };

    const result = service.getCalculatedPrice('BUY', currentPrice, '2.5');

    expect(result).toBe(225); // 90 * 2.5
  });

  // ── submitTrade tesztek ───────────────────────────────

  it('should set isSubmitting to true on submitTrade', () => {
    service.submitTrade('GAS', 'BUY', 10);

    expect(service.isSubmitting).toBe(true);
  });

  it('should call tradeOfferService.createTradeOffer with correct data', () => {
    service.submitTrade('GAS', 'BUY', 10);

    expect(tradeOfferServiceMock.createTradeOffer).toHaveBeenCalledWith({
      resourceType: 'GAS',
      offerType: 'BUY',
      quantity: 10
    });
  });

  it('should call createTradeOffer with SELL offer type', () => {
    service.submitTrade('ELECTRICITY', 'SELL', 50);

    expect(tradeOfferServiceMock.createTradeOffer).toHaveBeenCalledWith({
      resourceType: 'ELECTRICITY',
      offerType: 'SELL',
      quantity: 50
    });
  });

  it('should return observable from submitTrade', () => {
    const mockResponse = { id: 1, status: 'PENDING' };
    tradeOfferServiceMock.createTradeOffer.mockReturnValue(of(mockResponse));

    service.submitTrade('GAS', 'BUY', 10).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
  });
});
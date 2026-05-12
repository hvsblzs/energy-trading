import { TestBed } from '@angular/core/testing';
import { DispatcherService } from './dispatcher.service';
import { PricingService } from './pricing.service';
import { CentralStorageService } from './central-storage.service';
import { ToastService } from './toast.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

describe('DispatcherService', () => {
  let service: DispatcherService;
  let pricingServiceMock: any;
  let centralStorageServiceMock: any;
  let toastServiceMock: any;

  beforeEach(() => {
    pricingServiceMock = {
      getAllPrices: vi.fn().mockReturnValue(of([])),
      setPrice: vi.fn().mockReturnValue(of([]))
    };

    centralStorageServiceMock = {
      addQuantity: vi.fn().mockReturnValue(of({})),
      updateMaxQuantity: vi.fn().mockReturnValue(of({}))
    };

    toastServiceMock = {
      show: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        DispatcherService,
        { provide: PricingService, useValue: pricingServiceMock },
        { provide: CentralStorageService, useValue: centralStorageServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    });

    service = TestBed.inject(DispatcherService);
  });

  // loadAllPrices tesztek

  it('should call pricingService.getAllPrices', () => {
    const mockPrices = [
      { resourceType: 'GAS', buyPrice: 100, sellPrice: 90 }
    ];
    pricingServiceMock.getAllPrices.mockReturnValue(of(mockPrices));

    service.loadAllPrices().subscribe(prices => {
      expect(prices).toEqual(mockPrices);
    });

    expect(pricingServiceMock.getAllPrices).toHaveBeenCalledTimes(1);
  });

  // initPriceForm tesztek

  it('should initialize allPrices and selectedPriceResource', () => {
    const prices = [
      { resourceType: 'GAS', buyPrice: 100, sellPrice: 90 },
      { resourceType: 'ELECTRICITY', buyPrice: 50, sellPrice: 45 }
    ];

    service.initPriceForm(prices);

    expect(service.allPrices).toEqual(prices);
    expect(service.selectedPriceResource).toEqual(prices[0]);
  });

  it('should initialize priceForm for first resource', () => {
    const prices = [{ resourceType: 'GAS', buyPrice: 100, sellPrice: 90 }];

    service.initPriceForm(prices);

    expect(service.priceForm['GAS']).toEqual({
      buyPrice: '100',
      sellPrice: '90'
    });
  });

  it('should set selectedPriceResource to null when prices are empty', () => {
    service.initPriceForm([]);

    expect(service.selectedPriceResource).toBeNull();
  });

  it('should not initialize priceForm when prices are empty', () => {
    service.initPriceForm([]);

    expect(Object.keys(service.priceForm).length).toBe(0);
  });

  // selectPriceResource tesztek

  it('should set selectedPriceResource', () => {
    const price = { resourceType: 'GAS', buyPrice: 100, sellPrice: 90 };

    service.selectPriceResource(price);

    expect(service.selectedPriceResource).toEqual(price);
  });

  it('should initialize priceForm for selected resource if not exists', () => {
    const price = { resourceType: 'GAS', buyPrice: 100, sellPrice: 90 };

    service.selectPriceResource(price);

    expect(service.priceForm['GAS']).toEqual({
      buyPrice: '100',
      sellPrice: '90'
    });
  });

  it('should not overwrite existing priceForm entry', () => {
    const price = { resourceType: 'GAS', buyPrice: 100, sellPrice: 90 };
    service.priceForm['GAS'] = { buyPrice: '150', sellPrice: '130' };

    service.selectPriceResource(price);

    expect(service.priceForm['GAS']).toEqual({
      buyPrice: '150',
      sellPrice: '130'
    });
  });

  // savePrice tesztek

  it('should call pricingService.setPrice with correct data', () => {
    service.selectedPriceResource = { resourceType: 'GAS' };
    service.priceForm['GAS'] = { buyPrice: '150', sellPrice: '120' };

    service.savePrice();

    expect(pricingServiceMock.setPrice).toHaveBeenCalledWith({
      resourceType: 'GAS',
      buyPrice: 150,
      sellPrice: 120
    });
  });

  it('should return null when no selectedPriceResource', () => {
    service.selectedPriceResource = null;

    const result = service.savePrice();

    expect(result).toBeNull();
    expect(pricingServiceMock.setPrice).not.toHaveBeenCalled();
  });

  // addQuantity tesztek

  it('should call centralStorageService.addQuantity', () => {
    service.addQuantity('GAS', 200);

    expect(centralStorageServiceMock.addQuantity).toHaveBeenCalledWith('GAS', 200);
  });

  it('should return observable from addQuantity', () => {
    const mockResponse = { quantity: 700 };
    centralStorageServiceMock.addQuantity.mockReturnValue(of(mockResponse));

    service.addQuantity('GAS', 200).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
  });

  // updateMaxQuantity tesztek

  it('should call centralStorageService.updateMaxQuantity', () => {
    service.updateMaxQuantity('GAS', 10000);

    expect(centralStorageServiceMock.updateMaxQuantity).toHaveBeenCalledWith('GAS', 10000);
  });

  it('should return observable from updateMaxQuantity', () => {
    const mockResponse = { maxQuantity: 10000 };
    centralStorageServiceMock.updateMaxQuantity.mockReturnValue(of(mockResponse));

    service.updateMaxQuantity('GAS', 10000).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
  });
});
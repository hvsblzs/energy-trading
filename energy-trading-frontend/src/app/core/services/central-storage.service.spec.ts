import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CentralStorageService } from './central-storage.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('CentralStorageService', () => {
  let service: CentralStorageService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CentralStorageService]
    });

    service = TestBed.inject(CentralStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // getStorage tesztek

  it('should call GET /central_storage/:resourceType', () => {
    const mockStorage = { id: 1, resourceType: 'GAS', quantity: 500, maxQuantity: 5000};

    service.getStorage('GAS').subscribe(storage => {
      expect(storage).toEqual(mockStorage);
    });

    const req = httpMock.expectOne(`${apiUrl}/central_storage/GAS`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStorage);
  });

  it('should call coreect URL for different resource types', () => {
    service.getStorage('ELECTRICITY').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/central_storage/ELECTRICITY`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  // getAllStorage tesztek

  it('should call GET /central_storage', () => {
    const mockStorageList = [
      { id: 1, resourceType: 'GAS', quantity: 500, maxQuantity: 5000 },
      { id: 2, resourceType: 'ELECTRICITY', quantity: 200, maxQuantity: 10000 }
    ];

    service.getAllStorage().subscribe(storageList => {
      expect(storageList).toEqual(mockStorageList);
      expect(storageList.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/central_storage`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStorageList);
  });

  it('should return empty array when no storage items', () => {
    service.getAllStorage().subscribe(storageList => {
      expect(storageList).toEqual([]);
    });

    const req = httpMock.expectOne(`${apiUrl}/central_storage`);
    req.flush([]);
  });

  // addQuantity tesztek

  it('should call PATCH /central_storage/:resourceType/add with quantity', () => {
    const mockResponse = { id: 1, resourceType: 'GAS', quantity: 700, maxQuantity: 5000 };

    service.addQuantity('GAS', 200).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/central_storage/GAS/add`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({quantity: 200});
    req.flush(mockResponse);
  });

  it('should call correct URL for different resource types in addQuantity', () => {
    service.addQuantity('ELECTRICITY', 500).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/central_storage/ELECTRICITY/add`);
    expect(req.request.body).toEqual({ quantity: 500 });
    req.flush({});
  });

  // updateMaxQuantity tesztek

  it('should call PATCH /central_storage/:resourceType/max-quantity with maxQuantity', () => {
    const mockResponse = { id: 1, resourceType: 'GAS', quantity: 500, maxQuantity: 10000 };

    service.updateMaxQuantity('GAS', 10000).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/central_storage/GAS/max-quantity`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual( {maxQuantity: 10000 });
    req.flush(mockResponse);
  });

  it('should call correct URl for different resource types in updateMaxQuantity', () => {
    service.updateMaxQuantity('ELECTRICITY', 20000).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/central_storage/ELECTRICITY/max-quantity`);
    expect(req.request.body).toEqual({ maxQuantity: 20000 });
    req.flush({});
  });

})
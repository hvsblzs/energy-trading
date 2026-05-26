import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { AuthService } from '../../core/services/auth.service';
import { CentralStorageService } from '../../core/services/central-storage.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyResourcesService } from '../../core/services/company-resources.service';
import { CompanyInventoryService } from '../../core/services/company-inventory.service';
import { TransactionService } from '../../core/services/transaction.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { UserService } from '../../core/services/user.service';
import { TradingService } from '../../core/services/trading.service';
import { DispatcherService } from '../../core/services/dispatcher.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { ErrorService } from '../../core/services/error.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, TriangleAlert, Trash2, Plus, CircleDollarSign } from 'lucide-angular';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let authServiceMock: any;
  let centralStorageServiceMock: any;
  let resourceTypeServiceMock: any;
  let companyResourcesServiceMock: any;
  let companyInventoryServiceMock: any;
  let transactionServiceMock: any;
  let webSocketServiceMock: any;
  let userServiceMock: any;
  let tradingServiceMock: any;
  let dispatcherServiceMock: any;
  let modalServiceMock: any;
  let toastServiceMock: any;
  let errorServiceMock: any;

  const mockStorageItems = [
    { resourceType: 'GAS', resourceTypeId: 1, unit: 'm3', quantity: 500, maxQuantity: 5000 },
    { resourceType: 'ELECTRICITY', resourceTypeId: 2, unit: 'kWh', quantity: 200, maxQuantity: 10000 }
  ];

  const mockResourceTypes = [
    { id: 1, name: 'GAS', unit: 'm3', color: '#10b981', active: true },
    { id: 2, name: 'ELECTRICITY', unit: 'kWh', color: '#3b82f6', active: true }
  ];

  const mockStats = {
    period: 'DAILY',
    totalCreditVolume: 5000,
    resourceStats: [
      { resourceType: 'GAS', unit: 'm3', totalQuantity: 100, totalCredit: 5000 }
    ]
  };

  beforeEach(async () => {
    authServiceMock = {
      getRole: vi.fn().mockReturnValue('DISPATCHER'),
      getCompanyId: vi.fn().mockReturnValue(null)
    };

    centralStorageServiceMock = {
      getAllStorage: vi.fn().mockReturnValue(of([]))
    };

    resourceTypeServiceMock = {
      getAllResourceTypes: vi.fn().mockReturnValue(of(mockResourceTypes)),
      deleteResourceType: vi.fn().mockReturnValue(of(null))
    };

    companyResourcesServiceMock = {
      getMyResources: vi.fn().mockReturnValue(of([]))
    };

    companyInventoryServiceMock = {
      getMyInventory: vi.fn().mockReturnValue(of([]))
    };

    transactionServiceMock = {
      getStats: vi.fn().mockReturnValue(of(mockStats))
    };

    webSocketServiceMock = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      subscribe: vi.fn()
    };

    userServiceMock = {
      getMe: vi.fn().mockReturnValue(of({})),
      creditBalance$: of(null)
    };

    tradingServiceMock = {
      loadCurrentPrice: vi.fn().mockReturnValue(of({})),
      getCalculatedPrice: vi.fn().mockReturnValue(0),
      submitTrade: vi.fn().mockReturnValue(of({})),
      isSubmitting: false
    };

    dispatcherServiceMock = {
      loadAllPrices: vi.fn().mockReturnValue(of([])),
      initPriceForm: vi.fn(),
      allPrices: [],
      priceForm: {}
    };

    modalServiceMock = {
      open: vi.fn().mockReturnValue({ closed: of(null) })
    };

    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn()
    };

    errorServiceMock = {
      getErrorMessage: vi.fn().mockReturnValue('Error')
    };

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ TriangleAlert, Trash2, Plus, CircleDollarSign }),
        FormsModule,
        DecimalPipe
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: CentralStorageService, useValue: centralStorageServiceMock },
        { provide: ResourceTypeService, useValue: resourceTypeServiceMock },
        { provide: CompanyResourcesService, useValue: companyResourcesServiceMock },
        { provide: CompanyInventoryService, useValue: companyInventoryServiceMock },
        { provide: TransactionService, useValue: transactionServiceMock },
        { provide: WebSocketService, useValue: webSocketServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: TradingService, useValue: tradingServiceMock },
        { provide: DispatcherService, useValue: dispatcherServiceMock },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ErrorService, useValue: errorServiceMock },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    vi.spyOn(component as any, 'loadData').mockImplementation(() => {
      component.isLoading = false;
    });

    fixture.detectChanges();
  });

  // ── Inicializálás tesztek ─────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set isDispatcher true for DISPATCHER role', () => {
    expect(component.isDispatcher).toBe(true);
  });

  it('should set isCompanyUser false for DISPATCHER role', () => {
    expect(component.isCompanyUser).toBe(false);
  });

  it('should set isCompanyUser true for COMPANY_USER role', () => {
    authServiceMock.getRole.mockReturnValue('COMPANY_USER');
    component.selectedResource = {
      resourceTypeName: 'GAS',
      resourceTypeUnit: 'm3',
      resourceTypeColor: '#10b981'
    };
    component.ngOnInit();
    expect(component.isCompanyUser).toBe(true);
  });

  it('should call webSocketService.connect on init', () => {
    expect(webSocketServiceMock.connect).toHaveBeenCalled();
  });

  it('should call resourceTypeService.getAllResourceTypes on init', () => {
    expect(resourceTypeServiceMock.getAllResourceTypes).toHaveBeenCalled();
  });

  it('should call transactionService.getStats on init', () => {
    expect(transactionServiceMock.getStats).toHaveBeenCalled();
  });

  // ── hexToRgba tesztek ─────────────────────────────────

  it('should convert hex to rgba correctly', () => {
    const result = component.hexToRgba('#10b981', 0.15);
    expect(result).toBe('rgba(16, 185, 129, 0.15)');
  });

  it('should convert hex to rgba with different opacity', () => {
    const result = component.hexToRgba('#3b82f6', 1);
    expect(result).toBe('rgba(59, 130, 246, 1)');
  });

  // ── filteredStorageItems tesztek ──────────────────────

  it('should return all items when storageSearch is empty', () => {
    component.storageItems = [
      { data: { resourceType: 'GAS' }, displayValue: 0, percentage: 0, color: '#10b981', colorLight: '' },
      { data: { resourceType: 'ELECTRICITY' }, displayValue: 0, percentage: 0, color: '#3b82f6', colorLight: '' }
    ];
    component.storageSearch = '';
    expect(component.filteredStorageItems.length).toBe(2);
  });

  it('should filter storage items by search term', () => {
    component.storageItems = [
      { data: { resourceType: 'GAS' }, displayValue: 0, percentage: 0, color: '#10b981', colorLight: '' },
      { data: { resourceType: 'ELECTRICITY' }, displayValue: 0, percentage: 0, color: '#3b82f6', colorLight: '' }
    ];
    component.storageSearch = 'gas';
    expect(component.filteredStorageItems.length).toBe(1);
    expect(component.filteredStorageItems[0].data.resourceType).toBe('GAS');
  });

  it('should return empty array when no items match search', () => {
    component.storageItems = [
      { data: { resourceType: 'GAS' }, displayValue: 0, percentage: 0, color: '#10b981', colorLight: '' }
    ];
    component.storageSearch = 'WATER';
    expect(component.filteredStorageItems.length).toBe(0);
  });

  // ── paginatedStorageItems tesztek ─────────────────────

  it('should return first page of items', () => {
    component.storageItems = Array.from({ length: 10 }, (_, i) => ({
      data: { resourceType: `RESOURCE_${i}` },
      displayValue: 0, percentage: 0, color: '#10b981', colorLight: ''
    }));
    component.storagePage = 0;
    component.storagePageSize = 6;
    expect(component.paginatedStorageItems.length).toBe(6);
  });

  it('should return second page of items', () => {
    component.storageItems = Array.from({ length: 10 }, (_, i) => ({
      data: { resourceType: `RESOURCE_${i}` },
      displayValue: 0, percentage: 0, color: '#10b981', colorLight: ''
    }));
    component.storagePage = 1;
    component.storagePageSize = 6;
    expect(component.paginatedStorageItems.length).toBe(4);
  });

  // ── storageTotalPages tesztek ─────────────────────────

  it('should calculate total pages correctly', () => {
    component.storageItems = Array.from({ length: 10 }, (_, i) => ({
      data: { resourceType: `RESOURCE_${i}` },
      displayValue: 0, percentage: 0, color: '#10b981', colorLight: ''
    }));
    component.storagePageSize = 6;
    expect(component.storageTotalPages).toBe(2);
  });

  it('should return 1 page when items fit in one page', () => {
    component.storageItems = Array.from({ length: 3 }, (_, i) => ({
      data: { resourceType: `RESOURCE_${i}` },
      displayValue: 0, percentage: 0, color: '#10b981', colorLight: ''
    }));
    component.storagePageSize = 6;
    expect(component.storageTotalPages).toBe(1);
  });

  // ── onStorageSearch tesztek ───────────────────────────

  it('should reset page to 0 on search', () => {
    component.storagePage = 2;
    component.onStorageSearch();
    expect(component.storagePage).toBe(0);
  });

  // ── onPeriodChange tesztek ────────────────────────────

  it('should change statsPeriod on onPeriodChange', () => {
    component.onPeriodChange('WEEKLY');
    expect(component.statsPeriod).toBe('WEEKLY');
  });

  it('should call transactionService.getStats with new period', () => {
    component.onPeriodChange('WEEKLY');
    expect(transactionServiceMock.getStats).toHaveBeenCalledWith('WEEKLY');
  });

  // ── filteredResources tesztek ─────────────────────────

  it('should return all resources when resourceSearch is empty', () => {
    component.availableResources = [
      { resourceTypeName: 'GAS' },
      { resourceTypeName: 'ELECTRICITY' }
    ];
    component.resourceSearch = '';
    expect(component.filteredResources.length).toBe(2);
  });

  it('should filter resources by search term', () => {
    component.availableResources = [
      { resourceTypeName: 'GAS' },
      { resourceTypeName: 'ELECTRICITY' }
    ];
    component.resourceSearch = 'gas';
    expect(component.filteredResources.length).toBe(1);
  });

  // ── isQuantityValid tesztek ───────────────────────────

  it('should return false when quantity is empty', () => {
    component.quantity = '';
    expect(component.isQuantityValid).toBe(false);
  });

  it('should return false when quantity is 0', () => {
    component.quantity = '0';
    expect(component.isQuantityValid).toBe(false);
  });

  it('should return true when quantity is positive', () => {
    component.quantity = '10';
    expect(component.isQuantityValid).toBe(true);
  });

  // ── getGradientStyle tesztek ──────────────────────────

  it('should return correct gradient style', () => {
    const item = { data: {}, displayValue: 0, percentage: 50, color: '#10b981', colorLight: 'rgba(16, 185, 129, 0.15)' };
    const style = component.getGradientStyle(item);
    expect(style.background).toContain('50%');
    expect(style.background).toContain('rgba(16, 185, 129, 0.15)');
  });

  // ── ngOnDestroy tesztek ───────────────────────────────

  it('should call webSocketService.disconnect on destroy', () => {
    component.ngOnDestroy();
    expect(webSocketServiceMock.disconnect).toHaveBeenCalled();
  });

  // ── Template tesztek ──────────────────────────────────

  it('should show dispatcher buttons when isDispatcher is true', async () => {
    component.isDispatcher = true;
    component.isLoading = false;
    fixture.detectChanges();

    const newResourceButton = fixture.debugElement.query(By.css('.bg-emerald-600'));
    expect(newResourceButton).toBeTruthy();
  });

  it('should not show dispatcher buttons when isDispatcher is false', async () => {
    component.isDispatcher = false;
    component.isLoading = false;
    fixture.detectChanges();

    const newResourceButton = fixture.debugElement.query(By.css('.bg-emerald-600'));
    expect(newResourceButton).toBeFalsy();
  });

  it('should show search input when not loading', async () => {
    component.isLoading = false;
    fixture.detectChanges();

    const searchInput = fixture.debugElement.query(By.css('input[type="text"]'));
    expect(searchInput).toBeTruthy();
  });
});
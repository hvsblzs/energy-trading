import { Component, OnInit, OnDestroy, ChangeDetectorRef, Host } from '@angular/core';
import { DecimalPipe, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentralStorageService } from '../../core/services/central-storage.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyResourcesService } from '../../core/services/company-resources.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { CompanyInventoryService } from '../../core/services/company-inventory.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { UserService } from '../../core/services/user.service';
import { TradingService } from '../../core/services/trading.service';
import { DispatcherService } from '../../core/services/dispatcher.service';
import { ModalService } from '../../core/services/modal.service';
import { ConfirmDeleteModalComponent } from '../../shared/components/modals/confirm-delete-modal/confirm-delete-modal';
import { CreateResourceModalComponent } from '../../shared/components/modals/create-resource-modal/create-resource-modal';
import { PriceModalComponent } from '../../shared/components/modals/price-modal/price-modal';
import { AddQuantityModalComponent } from '../../shared/components/modals/add-quantity-modal/add-quantity-modal';
import { MaxQuantityModalComponent } from '../../shared/components/modals/max-quantity-modal/max-quantity-modal';
import { ConfirmTradeModalComponent } from '../../shared/components/modals/confirm-trade-modal/confirm-trade-modal';
import { HostListener } from '@angular/core';
import { LucideAngularModule, TriangleAlert, Trash2, Plus, CircleDollarSign } from 'lucide-angular';

interface StorageItem {
  data: any;
  displayValue: number;
  percentage: number;
  color: string;
  colorLight: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, NgStyle, FormsModule, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  // Icons
  readonly TriangleAlert = TriangleAlert;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly CircleDollarSign = CircleDollarSign;

  private companyId: number | null = null;
  hoveredButton: string | null = null;

  // ── Storage ──────────────────────────────────────────────
  storageItems: StorageItem[] = [];
  isLoading: boolean = true;
  private animationIntervals: any[] = [];
  private resourceTypeMap: Map<string, any> = new Map();

  // ── Trading ──────────────────────────────────────────────
  isCompanyUser: boolean = false;
  availableResources: any[] = [];
  selectedResource: any = null;
  offerType: 'BUY' | 'SELL' = 'BUY';
  quantity: string = '';
  currentPrice: any = null;
  isSubmitting: boolean = false;
  dropdownOpen: boolean = false;
  resourceSearch: string = '';

  // ── Stats ────────────────────────────────────────────────
  stats: any = null;
  statsPeriod: 'DAILY' | 'WEEKLY' = 'DAILY';
  isStatsLoading: boolean = false;

  // ── Preview ──────────────────────────────────────────────
  previewItems: StorageItem[] = [];
  companyInventory: any[] = [];
  companyInventoryAnimated: { [key: string]: number } = {};
  private inventoryAnimationIntervals: any[] = [];

  // ── Dispatcher ───────────────────────────────────────────
  isDispatcher: boolean = false;

  // ── Storage pagination + keresés ──────────────────────────
  storageSearch: string = '';
  storagePage: number = 0;
  storagePageSize: number = 6;

  constructor(
    private centralStorageService: CentralStorageService,
    private resourceTypeService: ResourceTypeService,
    private companyResourcesService: CompanyResourcesService,
    private authService: AuthService,
    private toastService: ToastService,
    private transactionService: TransactionService,
    private companyInventoryService: CompanyInventoryService,
    private webSocketService: WebSocketService,
    private userService: UserService,
    public tradingService: TradingService,
    public dispatcherService: DispatcherService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isCompanyUser = this.authService.getRole() === 'COMPANY_USER';
    this.isDispatcher = this.authService.getRole() === 'DISPATCHER';
    this.companyId = this.authService.getCompanyId();
    this.loadResourceTypes();
    this.initWebSocket();
  }

  // ── WebSocket ─────────────────────────────────────────────
  initWebSocket() {
    this.webSocketService.connect();

    this.webSocketService.subscribe('/topic/storage', () => {
      this.loadData();
      this.quantity = '';
      this.cdr.detectChanges();
    });
  }

  // ── Resource types ────────────────────────────────────────
  loadResourceTypes() {
    this.resourceTypeService.getAllResourceTypes().subscribe({
      next: (types) => {
        types.forEach(type => {
          this.resourceTypeMap.set(type.name, {
            label: type.name,
            color: type.color,
            colorLight: this.hexToRgba(type.color, 0.15)
          });
        });
        this.loadData();
        this.loadStats();
        if (this.isCompanyUser) {
          this.loadAvailableResources();
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // ── Storage ───────────────────────────────────────────────
  loadData() {
    this.isLoading = true;
    this.animationIntervals.forEach(i => clearInterval(i));
    this.animationIntervals = [];
    this.storageItems = [];
    
    setTimeout(() => {
      this.centralStorageService.getAllStorage().subscribe({
        next: (items) => {
          items.forEach((item: any) => {
            const config = this.resourceTypeMap.get(item.resourceType) ?? {
              label: item.resourceType,
              color: '#10b981',
              colorLight: 'rgba(16, 185, 129, 0.15)'
            };
            this.storageItems.push({
              data: item,
              displayValue: 0,
              percentage: 0,
              color: config.color,
              colorLight: config.colorLight
            });
            this.animateValue(this.storageItems.length - 1, item.quantity, item.maxQuantity);
          });
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }, 100);
  }

  animateValue(index: number, targetValue: number, maxQuantity: number) {
    const expectedLastIndex = this.storageItems.length - 1;
    const targetPercentage = Math.min((targetValue / maxQuantity) * 100, 100);
    let currentValue = 0;
    let currentPercentage = 0;
    const steps = 60;
    const valueIncrement = targetValue / steps;
    const percentageIncrement = targetPercentage / steps;

    const interval = setInterval(() => {
      currentValue += valueIncrement;
      currentPercentage += percentageIncrement;

      if (currentValue >= targetValue) {
        currentValue = targetValue;
        currentPercentage = targetPercentage;
        clearInterval(interval);

        if (index === expectedLastIndex) {
          if (this.isCompanyUser) {
            this.loadCompanyInventory();
          } else {
            if (this.selectedResource) {
              this.updatePreview();
            }
          }
        }
      }

      this.storageItems[index] = {
        ...this.storageItems[index],
        displayValue: Math.round(currentValue),
        percentage: Math.round(currentPercentage)
      };
      this.cdr.detectChanges();
    }, 16);

    this.animationIntervals.push(interval);
  }

  // ── Trading ───────────────────────────────────────────────
  loadAvailableResources() {
    this.companyResourcesService.getMyResources().subscribe({
      next: (resources) => {
        this.availableResources = resources;
        if (resources.length > 0) {
          this.selectResource(resources[0]);
          this.loadCurrentPrice();
        }
      },
      error: (err) => console.error(err)
    });
  }

  selectResource(resource: any) {
    this.selectedResource = resource;
    this.quantity = '';
    this.currentPrice = null;

    this.previewItems = this.storageItems
      .filter(item => item.data.resourceType === resource.resourceTypeName)
      .map(item => ({ ...item, displayValue: 0, percentage: 0 }));

    const invItem = this.companyInventory.find(inv => inv.resourceTypeName === resource.resourceTypeName);
    if (invItem) {
      this.companyInventoryAnimated[invItem.resourceTypeName] = 0;
      this.animateInventoryValue(invItem.resourceTypeName, parseFloat(invItem.quantity), true);
    }

    this.updatePreview();
    this.loadCurrentPrice();
  }

  loadCurrentPrice() {
    if (!this.selectedResource) return;
    this.tradingService.loadCurrentPrice(this.selectedResource.resourceTypeName).subscribe({
      next: (price) => {
        this.currentPrice = price;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  get calculatedPrice(): number {
    return this.tradingService.getCalculatedPrice(this.offerType, this.currentPrice, this.quantity);
  }

  openConfirmTradeModal() {
    const ref = this.modalService.open(ConfirmTradeModalComponent, {
      resourceTypeName: this.selectedResource?.resourceTypeName,
      resourceTypeUnit: this.selectedResource?.resourceTypeUnit,
      offerType: this.offerType,
      quantity: this.quantity,
      calculatedPrice: this.calculatedPrice
    });
    ref.closed.subscribe(result => {
      if (result === 'confirmed') {
        this.submitTrade();
      }
    });
  }

  onOfferTypeChange() { this.updatePreview(); }
  onQuantityChange() { this.updatePreview(); }

  submitTrade() {
    if (!this.selectedResource || !this.quantity || parseFloat(this.quantity) <= 0) return;
    this.isSubmitting = true;

    this.tradingService.submitTrade(
      this.selectedResource.resourceTypeName,
      this.offerType,
      parseFloat(this.quantity)
    ).subscribe({
      next: () => {
        this.toastService.success('Cserekérelem sikeresen elküldve!');
        this.quantity = '';
        this.isSubmitting = false;
        this.tradingService.isSubmitting = false;
        this.loadData();
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt a kereskedés során!');
        this.isSubmitting = false;
        this.tradingService.isSubmitting = false;
        this.loadData();
        this.loadStats();
        this.cdr.detectChanges();
      }
    });
  }

  get filteredResources(): any[] {
    if (!this.resourceSearch) return this.availableResources;
    return this.availableResources.filter(r =>
      r.resourceTypeName.toLowerCase().startsWith(this.resourceSearch.toLowerCase())
    );
  }

  @HostListener('document:click')
  closeDropdowns(){
    if(this.dropdownOpen){
      this.dropdownOpen = false;
      this.resourceSearch = '';
    }
  }

  // ── Stats ─────────────────────────────────────────────────
  loadStats(period: 'DAILY' | 'WEEKLY' = this.statsPeriod) {
    this.isStatsLoading = true;
    this.transactionService.getStats(period).subscribe({
      next: (data) => {
        this.stats = data;
        this.isStatsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isStatsLoading = false;
      }
    });
  }

  onPeriodChange(period: 'DAILY' | 'WEEKLY') {
    this.statsPeriod = period;
    this.loadStats(period);
  }

  // ── Preview ───────────────────────────────────────────────
  loadCompanyInventory() {
    this.companyInventoryService.getMyInventory().subscribe({
      next: (items) => {
        this.companyInventory = items;
        items.forEach(item => {
          this.companyInventoryAnimated[item.resourceTypeName] = 0;
        });
        if (this.selectedResource) {
          const invItem = items.find(inv => inv.resourceTypeName === this.selectedResource.resourceTypeName);
          if (invItem) {
            this.animateInventoryValue(invItem.resourceTypeName, parseFloat(invItem.quantity), true);
          }
          this.updatePreview();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  animateInventoryValue(resourceTypeName: string, targetValue: number, fromZero: boolean = false) {
    this.inventoryAnimationIntervals.forEach(i => clearInterval(i));
    this.inventoryAnimationIntervals = [];

    let currentValue = fromZero ? 0 : (this.companyInventoryAnimated[resourceTypeName] ?? 0);
    const steps = 60;
    const valueIncrement = (targetValue - currentValue) / steps;

    if (valueIncrement === 0) {
      this.companyInventoryAnimated[resourceTypeName] = Math.round(targetValue);
      this.cdr.detectChanges();
      return;
    }

    const interval = setInterval(() => {
      currentValue += valueIncrement;
      if (Math.abs(currentValue - targetValue) < 1) {
        currentValue = targetValue;
        clearInterval(interval);
      }
      this.companyInventoryAnimated[resourceTypeName] = Math.round(currentValue);
      this.cdr.detectChanges();
    }, 16);

    this.inventoryAnimationIntervals.push(interval);
  }

  updatePreview() {
    const selectedItems = this.storageItems.filter(item =>
      item.data.resourceType === this.selectedResource?.resourceTypeName
    );

    if (!this.selectedResource || !this.quantity || parseFloat(this.quantity) === 0) {
      this.animationIntervals.forEach(i => clearInterval(i));
      this.animationIntervals = [];

      selectedItems.forEach((item) => {
        let currentValue = 0;
        let currentPercentage = 0;
        const targetValue = Math.round(item.data.quantity);
        const targetPercentage = Math.round((item.data.quantity / item.data.maxQuantity) * 100);
        const steps = 60;
        const valueIncrement = targetValue / steps;
        const percentageIncrement = targetPercentage / steps;

        this.previewItems = [{ ...item, displayValue: 0, percentage: 0 }];

        const interval = setInterval(() => {
          currentValue += valueIncrement;
          currentPercentage += percentageIncrement;
          if (currentValue >= targetValue) {
            currentValue = targetValue;
            currentPercentage = targetPercentage;
            clearInterval(interval);
          }
          this.previewItems[0] = {
            ...this.previewItems[0],
            displayValue: Math.round(currentValue),
            percentage: Math.round(currentPercentage)
          };
          this.cdr.detectChanges();
        }, 16);

        this.animationIntervals.push(interval);
      });

      const invItem = this.companyInventory.find(inv => inv.resourceTypeName === this.selectedResource?.resourceTypeName);
      if (invItem) {
        this.animateInventoryValue(invItem.resourceTypeName, parseFloat(invItem.quantity));
      }
      return;
    }

    selectedItems.forEach((item) => {
      const previewIndex = 0;
      let currentValue = this.previewItems[previewIndex]?.displayValue ?? item.displayValue;
      let currentPercentage = this.previewItems[previewIndex]?.percentage ?? item.percentage;
      const delta = this.offerType === 'BUY' ? -parseFloat(this.quantity) : parseFloat(this.quantity);
      const targetValue = Math.max(0, item.data.quantity + delta);
      const targetPercentage = Math.min((targetValue / item.data.maxQuantity) * 100, 100);
      const steps = 30;
      const valueIncrement = (targetValue - currentValue) / steps;
      const percentageIncrement = (targetPercentage - currentPercentage) / steps;

      const interval = setInterval(() => {
        currentValue += valueIncrement;
        currentPercentage += percentageIncrement;
        if (Math.abs(currentValue - targetValue) < 1) {
          currentValue = targetValue;
          currentPercentage = targetPercentage;
          clearInterval(interval);
        }
        this.previewItems[previewIndex] = {
          ...this.previewItems[previewIndex],
          displayValue: Math.round(currentValue),
          percentage: Math.round(currentPercentage)
        };
        this.cdr.detectChanges();
      }, 16);

      this.animationIntervals.push(interval);
    });

    const invItem = this.companyInventory.find(inv => inv.resourceTypeName === this.selectedResource?.resourceTypeName);
    if (invItem) {
      const delta = this.offerType === 'BUY' ? parseFloat(this.quantity) : -parseFloat(this.quantity);
      const targetInventory = Math.max(0, parseFloat(invItem.quantity) + delta);
      this.animateInventoryValue(invItem.resourceTypeName, targetInventory);
    }
  }

  // ── Dispatcher ────────────────────────────────────────────
  openPriceModal() {
    const ref = this.modalService.open(PriceModalComponent);
    ref.closed.subscribe(result => { 
      if(result === 'saved'){
        this.toastService.success('Ár sikeresen frissítve!');
        this.loadData();
      }
    })
  }

  openAddQuantityModal(item: any) {
    const ref = this.modalService.open(AddQuantityModalComponent, {
      resourceType: item.data.resourceType,
      unit: item.data.unit,
      quantity: item.data.quantity,
      maxQuantity: item.data.maxQuantity
    });
    ref.closed.subscribe(result => {
      if(result === 'added'){
        this.toastService.success('Mennyiség sikeresen hozzáadva!');
        this.loadData();
      }
    });
  }

  openMaxQuantityModal(item: any) {
    const ref = this.modalService.open(MaxQuantityModalComponent, {
      resourceType: item.data.resourceType,
      unit: item.data.unit,
      maxQuantity: item.data.maxQuantity
    });
    ref.closed.subscribe(result => {
      if (result === 'updated') {
        this.toastService.success('Maximum kapacitás sikeresen frissítve!');
        this.loadData();
      }
    });
  }

  // ── Resource type létrehozás / törlés ───────────────────────────────────────────
  openCreateResourceModal(){
    const ref = this.modalService.open(CreateResourceModalComponent);
    ref.closed.subscribe(result => {
      if (result === 'created') {
        this.loadResourceTypes();
      }
    });
  }

  openDeleteResourceModal(item: any){
    const ref = this.modalService.open(ConfirmDeleteModalComponent, {
      title: 'Nyersanyag törlése',
      itemName: item.data.resourceType,
      message: 'nyersanyagot? Ez a művelet nem visszavonható, minden kapcsolódó adat törlődik.'
    });
    ref.closed.subscribe(result => {
      if (result === 'confirmed') {
        this.resourceTypeService.deleteResourceType(item.data.resourceTypeId).subscribe({
          next: () => {
            this.toastService.success('Nyersanyag sikeresen törölve!');
            this.loadResourceTypes();
          },
          error: (err) => this.toastService.error(err.error?.error ?? 'Hiba történt!')
        });
      }
    });
  }

  // ── Storage pagination + keresés ──────────────────────────
  get filteredStorageItems(): StorageItem[] {
    if(!this.storageSearch) return this.storageItems;
    return this.storageItems.filter(item => 
      item.data.resourceType.toLowerCase().startsWith(this.storageSearch.toLowerCase())
    );
  }

  get paginatedStorageItems(): StorageItem[] {
    const start = this.storagePage * this.storagePageSize;
    return this.filteredStorageItems.slice(start, start + this.storagePageSize);
  }

  get storageTotalPages(): number{
    return Math.ceil(this.filteredStorageItems.length / this.storagePageSize);
  }

  onStorageSearch(){
    this.storagePage = 0;
  }

  // ── Helpers ───────────────────────────────────────────────
  getGradientStyle(item: StorageItem) {
    return {
      'background': `linear-gradient(to top, ${item.colorLight} ${item.percentage}%, transparent ${item.percentage}%)`
    };
  }

  get isQuantityValid(): boolean {
    return !!this.quantity && parseFloat(this.quantity) > 0;
  }

  hexToRgba(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  ngOnDestroy() {
    this.animationIntervals.forEach(i => clearInterval(i));
    this.inventoryAnimationIntervals.forEach(i => clearInterval(i));
    this.webSocketService.disconnect();
  }
}
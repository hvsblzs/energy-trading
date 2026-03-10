import { Injectable } from '@angular/core';
import { PricingService } from './pricing.service';
import { CentralStorageService } from './central-storage.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class DispatcherService {

  allPrices: any[] = [];
  selectedPriceResource: any = null;
  priceForm: { [key: string]: { buyPrice: string, sellPrice: string } } = {};
  isSubmitting: boolean = false;

  constructor(
    private pricingService: PricingService,
    private centralStorageService: CentralStorageService,
    private toastService: ToastService
  ) {}

  loadAllPrices() {
    return this.pricingService.getAllPrices();
  }

  initPriceForm(prices: any[]) {
    this.allPrices = prices;
    this.selectedPriceResource = prices[0] ?? null;
    if (this.selectedPriceResource) {
      this.priceForm[this.selectedPriceResource.resourceType] = {
        buyPrice: this.selectedPriceResource.buyPrice.toString(),
        sellPrice: this.selectedPriceResource.sellPrice.toString()
      };
    }
  }

  selectPriceResource(price: any) {
    this.selectedPriceResource = price;
    if (!this.priceForm[price.resourceType]) {
      this.priceForm[price.resourceType] = {
        buyPrice: price.buyPrice.toString(),
        sellPrice: price.sellPrice.toString()
      };
    }
  }

  savePrice() {
    if (!this.selectedPriceResource) return null;
    const form = this.priceForm[this.selectedPriceResource.resourceType];
    return this.pricingService.setPrice({
      resourceType: this.selectedPriceResource.resourceType,
      buyPrice: parseFloat(form.buyPrice),
      sellPrice: parseFloat(form.sellPrice)
    });
  }

  addQuantity(resourceType: string, quantity: number) {
    return this.centralStorageService.addQuantity(resourceType, quantity);
  }

  updateMaxQuantity(resourceType: string, maxQuantity: number) {
    return this.centralStorageService.updateMaxQuantity(resourceType, maxQuantity);
  }
}
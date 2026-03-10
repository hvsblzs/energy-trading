import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PricingService } from './pricing.service';
import { TradeOfferService } from './trade-offers.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class TradingService {

  // Events hogy a komponens tudjon reagálni
  onTradeSuccess$ = new Subject<void>();
  onTradeError$ = new Subject<void>();

  currentPrice: any = null;
  isSubmitting: boolean = false;

  constructor(
    private pricingService: PricingService,
    private tradeOfferService: TradeOfferService,
    private toastService: ToastService
  ) {}

  loadCurrentPrice(resourceTypeName: string) {
    return this.pricingService.getCurrentPrice(resourceTypeName);
  }

  getCalculatedPrice(offerType: 'BUY' | 'SELL', currentPrice: any, quantity: string): number {
    if (!currentPrice || !quantity) return 0;
    const pricePerUnit = offerType === 'BUY'
      ? currentPrice.sellPrice
      : currentPrice.buyPrice;
    return pricePerUnit * parseFloat(quantity);
  }

  submitTrade(resourceTypeName: string, offerType: 'BUY' | 'SELL', quantity: number) {
    this.isSubmitting = true;
    return this.tradeOfferService.createTradeOffer({
      resourceType: resourceTypeName,
      offerType: offerType,
      quantity: quantity
    });
  }
}
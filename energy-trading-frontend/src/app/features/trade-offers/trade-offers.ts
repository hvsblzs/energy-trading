import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeOfferService } from '../../core/services/trade-offers.service';
import { ToastService } from '../../core/services/toast.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-trade-offers',
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './trade-offers.html',
  styleUrl: './trade-offers.css',
})
export class TradeOffersComponent implements OnInit, OnDestroy{

  pendingOffers: any[] = [];
  isLoading: boolean = false;

  showApproveModal: boolean = false;
  showRejectModal: boolean = false;
  selectedOffer: any = null;
  rejectNotes: string = '';
  isSubmitting: boolean = false;

  constructor(
    private tradeOfferService: TradeOfferService,
    private toastService: ToastService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadPendingOffers();
    this.initWebSocket();
  }

  initWebSocket(){
    this.webSocketService.connect();
    this.webSocketService.subscribe('/topic/trade-offers', (message) => {
      this.loadPendingOffers();
      this.cdr.detectChanges();
    })
  }

  loadPendingOffers() {
    this.isLoading = true;
    this.tradeOfferService.getPendingTradeOffers().subscribe({
      next: (offers) => {
        this.pendingOffers = offers;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openApproveModal(offer: any){
    this.selectedOffer = offer;
    this.showApproveModal = true;
  }

  openRejectModal(offer: any){
    this.selectedOffer = offer;
    this.rejectNotes = '';
    this.showRejectModal = true;
  }

  approve(){
    if(!this.selectedOffer) return;
    this.isSubmitting = true;
    this.tradeOfferService.approveTradeOffer(this.selectedOffer.id).subscribe({
      next: () => {
        this.toastService.success("Cserekérelem sikeresen elfogadva!");
        this.showApproveModal = false;
        this.selectedOffer = null;
        this.isSubmitting = false;
        this.loadPendingOffers();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.showApproveModal = false;
        this.isSubmitting = false;
      }
    });
  }

  reject(){
    if(!this.selectedOffer) return;
    this.isSubmitting = true;
    this.tradeOfferService.rejectTradeOffer(this.selectedOffer.id, this.rejectNotes).subscribe({
      next: () => {
        this.toastService.success('Trade offer rejected.');
        this.showRejectModal = false;
        this.selectedOffer = null;
        this.rejectNotes = '';
        this.isSubmitting = false;
        this.loadPendingOffers();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.showRejectModal = false;
        this.isSubmitting = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

}

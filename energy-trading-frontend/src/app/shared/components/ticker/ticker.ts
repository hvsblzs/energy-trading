import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-ticker',
  imports: [],
  templateUrl: './ticker.html',
  styleUrl: './ticker.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TickerComponent implements OnInit, OnDestroy, AfterViewInit {

  transactions: any[] = [];
  private refreshInterval: any;
  @ViewChild('tickerContent') tickerContent!: ElementRef;

  constructor(
    private transactionService: TransactionService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadTransactions();
    this.refreshInterval = setInterval(() => this.loadTransactions(), 30000);
  }

  ngAfterViewInit(): void {
    this.updateTickerSpeed();
  }

  loadTransactions(){
    this.transactionService.getRecentTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.cdr.markForCheck();
        setTimeout(() => this.updateTickerSpeed(), 50);
      },
      error: (err) => console.error(err)
    });
  }

  updateTickerSpeed(){
    if(!this.tickerContent) return;
    const el = this.tickerContent.nativeElement;
    const contentWidth = el.scrollWidth / 2; // felére osztjuk mert duplikált
    const pixelsPerSecond = 80; // fix sebesség px/s
    const duration = contentWidth / pixelsPerSecond;
    el.style.animationDuration = `${duration}s`;
  }

  formatTicker(transaction: any): string{
    const action = transaction.offerType === 'Bought' ? 'bought' : 'sold';
    return `${transaction.companyName} ${action} ${transaction.quantity} ${transaction.unit} ${transaction.resourceType} @ ${transaction.creditAmount} credits`;
  }

  isBuy(transaction: any): boolean{
    return transaction.offerType === 'Bought';
  }

  ngOnDestroy(): void {
    if(this.refreshInterval){
      clearInterval(this.refreshInterval);
    }
  }
}
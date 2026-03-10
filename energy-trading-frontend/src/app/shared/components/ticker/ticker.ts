import { Component, OnInit, OnDestroy } from '@angular/core';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-ticker',
  imports: [],
  templateUrl: './ticker.html',
  styleUrl: './ticker.css',
})
export class TickerComponent implements OnInit, OnDestroy {

  transactions: any[] = [];
  private refreshInterval: any;

  constructor(private transactionService: TransactionService){}

  ngOnInit(): void {
    this.loadTransactions();
    // 30 másodpercenként frissül
    this.refreshInterval = setInterval(() => this.loadTransactions(), 30000);
  }

  loadTransactions(){
    this.transactionService.getRecentTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
      },
      error: (err) => console.error(err)
    });
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

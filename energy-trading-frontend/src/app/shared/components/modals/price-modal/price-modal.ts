import { ChangeDetectorRef, Component, Inject, OnInit, HostListener } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { DispatcherService } from '../../../../core/services/dispatcher.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-price-modal',
  imports: [FormsModule],
  templateUrl: './price-modal.html',
  styleUrl: './price-modal.css',
})
export class PriceModalComponent implements OnInit {

  dropdownOpen: boolean = false;
  resourceSearch = '';

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
    private toastService: ToastService,
    public dispatcherService: DispatcherService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit() {
    this.dispatcherService.allPrices = [];
    this.dispatcherService.selectedPriceResource = null;
    this.dispatcherService.priceForm = {};
    
    this.dispatcherService.loadAllPrices().subscribe({
      next: (prices) => {
        this.dispatcherService.initPriceForm(prices);
        prices.forEach(price => {
          this.dispatcherService.priceForm[price.resourceType] = {
            buyPrice: price.buyPrice.toString(),
            sellPrice: price.sellPrice.toString()
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.cancel();
      }
    });
  }

  save(){
    const result = this.dispatcherService.savePrice();
    if(!result) return;
    result.subscribe({
      next: () => {
        this.dialogRef.close("saved");
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.cancel();
      }
    });
  }

  cancel(){
    this.dialogRef.close();
  }

  selectPrice(price: any){
    this.dispatcherService.selectPriceResource(price);
    this.dropdownOpen = false;
  }

  get filteredPrices(): any[] {
    if (!this.resourceSearch) return this.dispatcherService.allPrices;
    return this.dispatcherService.allPrices.filter(p => 
      p.resourceType.toLowerCase().startsWith(this.resourceSearch.toLowerCase())
    );
  }

  @HostListener('document:click')
  closeDropdown(){
    if(this.dropdownOpen){
      this.dropdownOpen = false;
      this.resourceSearch = '';
    }
  }
}

import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DispatcherService } from '../../../../core/services/dispatcher.service';
import { ToastService } from '../../../../core/services/toast.service';

export interface AddQuantityData{
  resourceType: string;
  unit: string;
  quantity: number;
  maxQuantity: number;
}

@Component({
  selector: 'app-add-quantity-modal',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './add-quantity-modal.html',
  styleUrl: './add-quantity-modal.css',
})
export class AddQuantityModalComponent {

  amount: string = '';

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: AddQuantityData,
    private toastService: ToastService,
    public dispatcherService: DispatcherService
  ){}

  submit(){
    if(!this.amount) return;
    this.dispatcherService.addQuantity(this.data.resourceType, parseFloat(this.amount)).subscribe({
      next: () => {
        this.dialogRef.close('added');
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
}

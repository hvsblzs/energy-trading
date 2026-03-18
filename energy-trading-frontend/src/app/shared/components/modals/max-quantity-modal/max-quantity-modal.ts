import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DispatcherService } from '../../../../core/services/dispatcher.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorService } from '../../../../core/services/error.service';

export interface MaxQuantityData{
  resourceType: string;
  unit: string;
  maxQuantity: number;
}

@Component({
  selector: 'app-max-quantity-modal',
  imports: [FormsModule, DecimalPipe, TranslateModule],
  templateUrl: './max-quantity-modal.html',
  styleUrl: './max-quantity-modal.css',
})
export class MaxQuantityModalComponent {

  newMaxQuantity: string = '';

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: MaxQuantityData,
    private toastService: ToastService,
    private errorService: ErrorService,
    public dispatcherService: DispatcherService
  ){}

  submit(){
    if(!this.newMaxQuantity) return;
    this.dispatcherService.updateMaxQuantity(this.data.resourceType, parseFloat(this.newMaxQuantity)).subscribe({
      next: () => {
        this.dialogRef.close('updated');
      },
      error: (err) => {
        this.toastService.error(this.errorService.getErrorMessage(err));
        this.cancel();
      }
    });
  }

  cancel(){
    this.dialogRef.close();
  }
}

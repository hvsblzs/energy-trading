import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DecimalPipe } from '@angular/common';

export interface ConfirmTradeData {
  resourceTypeName: string;
  resourceTypeUnit: string;
  offerType: 'BUY' | 'SELL';
  quantity: string;
  calculatedPrice: number;
}

@Component({
  selector: 'app-confirm-trade-modal',
  imports: [DecimalPipe],
  templateUrl: './confirm-trade-modal.html',
  styleUrl: './confirm-trade-modal.css'
})
export class ConfirmTradeModalComponent {

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: ConfirmTradeData
  ) {}

  confirm() {
    this.dialogRef.close('confirmed');
  }

  cancel() {
    this.dialogRef.close();
  }
}
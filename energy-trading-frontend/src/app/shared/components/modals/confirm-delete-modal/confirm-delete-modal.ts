import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfirmDeleteData{
  title: string;
  message: string;
  itemName: string;
}

@Component({
  selector: 'app-confirm-delete-modal',
  imports: [TranslateModule],
  templateUrl: './confirm-delete-modal.html',
  styleUrl: './confirm-delete-modal.css',
})
export class ConfirmDeleteModalComponent {

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: ConfirmDeleteData
  ){}

  confirm(){
    this.dialogRef.close('confirmed');
  }

  cancel(){
    this.dialogRef.close();
  }
}

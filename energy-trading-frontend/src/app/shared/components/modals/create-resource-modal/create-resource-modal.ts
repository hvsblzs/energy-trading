import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { ResourceTypeService } from '../../../../core/services/resource-type.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-create-resource-modal',
  imports: [FormsModule],
  templateUrl: './create-resource-modal.html',
  styleUrl: './create-resource-modal.css',
})
export class CreateResourceModalComponent {

  form = {
    name: '',
    unit: '',
    color: '#10b981',
    buyPrice: '',
    sellPrice: ''
  };
  isSubmitting = false;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
    private resourceTypeService: ResourceTypeService,
    private toastService: ToastService
  ){}

  submit(){
    if(!this.form.name || !this.form.unit || !this.form.buyPrice || !this.form.sellPrice) return;
    this.isSubmitting = true;
    this.resourceTypeService.createResourceType({
      ...this.form,
      buyPrice: parseFloat(this.form.buyPrice),
      sellPrice: parseFloat(this.form.sellPrice)
    }).subscribe({
      next: () => {
        this.toastService.success('Nyersanyag sikeresen létrehozva!');
        this.dialogRef.close('created');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.isSubmitting = false;
        this.cancel();
      }
    });
  }

  cancel(){
    this.dialogRef.close();
  }
}

import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../../core/services/company.service';
import { ToastService } from '../../../../core/services/toast.service';

export interface EditCompanyData {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditBalance: number;
}

@Component({
  selector: 'app-edit-company-modal',
  imports: [FormsModule],
  templateUrl: './edit-company-modal.html',
})
export class EditCompanyModalComponent {

  form = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };

  errors = {
    name: '',
    email: ''
  };

  isSubmitting = false;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: EditCompanyData,
    private companyService: CompanyService,
    private toastService: ToastService
  ) {
    this.form = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address
    };
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validate(): boolean {
    this.errors = { name: '', email: '' };
    let valid = true;

    if (!this.form.name) {
      this.errors.name = 'A cégnév megadása kötelező.';
      valid = false;
    }
    if (this.form.email && !this.isValidEmail(this.form.email)) {
      this.errors.email = 'Érvénytelen email formátum.';
      valid = false;
    }
    return valid;
  }

  submit() {
    if (!this.validate()) return;
    this.isSubmitting = true;
    this.companyService.updateCompany(this.data.id, this.form).subscribe({
      next: () => {
        this.toastService.success('Cég sikeresen frissítve!');
        this.dialogRef.close('updated');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.isSubmitting = false;
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
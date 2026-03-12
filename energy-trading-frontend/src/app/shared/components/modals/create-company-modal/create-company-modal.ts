import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../../core/services/company.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-create-company-modal',
  imports: [FormsModule],
  templateUrl: './create-company-modal.html',
  styleUrl: './create-company-modal.css',
})
export class CreateCompanyModalComponent {

  form = {
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    creditBalance: 0,
    userEmail: '',
    password: ''
  };

  errors = {
    companyName: '',
    companyEmail: '',
    userEmail: '',
    password: ''
  };

  isSubmitting = false;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
    private companyService: CompanyService,
    private toastService: ToastService
  ){}

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validate(): boolean {
    this.errors = { companyName: '', companyEmail: '', userEmail: '', password: '' };
    let valid = true;

    if (!this.form.companyName) {
      this.errors.companyName = 'A cégnév megadása kötelező.';
      valid = false;
    }
    if (this.form.companyEmail && !this.isValidEmail(this.form.companyEmail)) {
      this.errors.companyEmail = 'Érvénytelen email formátum.';
      valid = false;
    }
    if (!this.form.userEmail || !this.isValidEmail(this.form.userEmail)) {
      this.errors.userEmail = 'Érvényes email cím megadása kötelező.';
      valid = false;
    }
    if (!this.form.password || this.form.password.length < 6) {
      this.errors.password = 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
      valid = false;
    }
    return valid;
  }

  submit() {
    if (!this.validate()) return;
    this.isSubmitting = true;
    this.companyService.createCompanyWithUser(this.form).subscribe({
      next: () => {
        this.toastService.success('Cég sikeresen létrehozva!');
        this.dialogRef.close('created');
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

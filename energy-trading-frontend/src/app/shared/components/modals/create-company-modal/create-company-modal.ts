import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../../core/services/company.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreditCard } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-create-company-modal',
  imports: [FormsModule, TranslateModule],
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
    private toastService: ToastService,
    private errorService: ErrorService,
    private translate: TranslateService
  ){}

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validate(): boolean {
    this.errors = { companyName: '', companyEmail: '', userEmail: '', password: ''};
    let valid = true;

    if (!this.form.companyName) {
      this.errors.companyName = this.translate.instant('modals.createCompany.validation.companyNameRequired');
      valid = false;
    }
    if (this.form.companyEmail && !this.isValidEmail(this.form.companyEmail)) {
      this.errors.companyEmail = this.translate.instant('modals.createCompany.validation.invalidEmail');
      valid = false;
    }
    if (!this.form.userEmail || !this.isValidEmail(this.form.userEmail)) {
      this.errors.userEmail = this.translate.instant('modals.createCompany.validation.userEmailRequired');
      valid = false;
    }
    if (!this.form.password || this.form.password.length < 6) {
      this.errors.password = this.translate.instant('modals.createCompany.validation.passwordLength');
      valid = false;
    }
    return valid;
  }

  submit() {
    if (!this.validate()) return;
    this.isSubmitting = true;
    this.companyService.createCompanyWithUser(this.form).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('modals.createCompany.toasts.created'));
        this.dialogRef.close('created');
      },
      error: (err) => {
        this.toastService.error(this.errorService.getErrorMessage(err));
        this.isSubmitting = false;
        this.cancel();
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}

import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../../core/services/company.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorService } from '../../../../core/services/error.service';

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
  imports: [FormsModule, TranslateModule],
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
    private toastService: ToastService,
    private errorService: ErrorService,
    private translate: TranslateService
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
      this.errors.name = this.translate.instant('modals.editCompany.validation.nameRequired');
      valid = false;
    }
    if (this.form.email && !this.isValidEmail(this.form.email)) {
      this.errors.email = this.translate.instant('modals.editCompany.validation.invalidEmail');
      valid = false;
    }
    return valid;
  }

  submit() {
    if (!this.validate()) return;
    this.isSubmitting = true;
    this.companyService.updateCompany(this.data.id, this.form).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('modals.editCompany.toasts.updated'));
        this.dialogRef.close('updated');
      },
      error: (err) => {
        this.toastService.error(this.errorService.getErrorMessage(err));
        this.isSubmitting = false;
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
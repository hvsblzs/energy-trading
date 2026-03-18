import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorService } from '../../../../core/services/error.service';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

export interface ResetPasswordModalData{
  userId: number;
  userEmail: string;
}

@Component({
  selector: 'app-reset-password-modal',
  imports: [FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './reset-password-modal.html',
  styleUrl: './reset-password-modal.css',
})
export class ResetPasswordModalComponent {

  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  form = {
    newPassword: '',
    confirmPassword: ''
  };

  errors = {
    newPassword: '',
    confirmPassword: ''
  };

  isSubmitting = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: ResetPasswordModalData,
    private userService: UserService,
    private toastService: ToastService,
    private translate: TranslateService,
    private errorService: ErrorService
  ){}

  validate(): boolean{
    this.errors = {newPassword: '', confirmPassword: ''};
    let valid = true;

    if(!this.form.newPassword || this.form.newPassword.length < 6){
      this.errors.newPassword = this.translate.instant('modals.resetPassword.validation.passwordLength');
      valid = false;
    }
    if(this.form.newPassword !== this.form.confirmPassword){
      this.errors.confirmPassword = this.translate.instant('modals.resetPassword.validation.passwordMismatch');
      valid = false;
    }
    return valid;
  }

  submit(){
    if(!this.validate()) return;
    this.isSubmitting = true;
    this.userService.resetPassword(this.data.userId, this.form.newPassword).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('modals.resetPassword.toasts.success'));
        this.dialogRef.close('reset');
      },
      error: (err) => {
        this.toastService.error(this.errorService.getErrorMessage(err));
        this.isSubmitting = false;
      }
    });
  }

  cancel(){
    this.dialogRef.close();
  }

  switchPasswordVisibility(){
    this.showPassword = !this.showPassword;
  }

  switchConfirmPasswordVisibility(){
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}

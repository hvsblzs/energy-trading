import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';

export interface AddUserModalData {
  companyId: number;
  companyName: string;
}

@Component({
  selector: 'app-add-user-modal',
  imports: [FormsModule],
  templateUrl: './add-user-modal.html',
  styleUrl: './add-user-modal.css',
})
export class AddUserModalComponent {

  form = {
    email: '',
    password: ''
  };

  errors = {
    email: '',
    password: ''
  };

  isSubmitting = false;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: AddUserModalData,
    private userService: UserService,
    private toastService: ToastService
  ){}

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validate(): boolean{
    this.errors = { email: '', password: ''};
    let valid = true;

    if(!this.form.email || !this.isValidEmail(this.form.email)){
      this.errors.email = 'Érvényes email cím megadása kötelező';
      valid = false;
    }
    if(!this.form.password || this.form.password.length < 6){
      this.errors.password = 'A jelszónak legalább 6 karakter hosszúnak kell lennie!';
      valid = false;
    }
    return valid;
  }

  submit(){
    if(!this.validate()) return;
    this.isSubmitting = true;
    this.userService.createUserForCompany(this.data.companyId, this.form).subscribe({
      next: () => {
        this.toastService.success('Felhasználó sikeresen létrehozva!');
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

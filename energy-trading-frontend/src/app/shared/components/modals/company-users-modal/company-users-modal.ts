import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface CompanyUsersModalData{
  companyId: number;
  companyName: string;
}

@Component({
  selector: 'app-company-users-modal',
  imports: [],
  templateUrl: './company-users-modal.html',
  styleUrl: './company-users-modal.css',
})
export class CompanyUsersModalComponent implements OnInit{

  users: any[] = [];
  isLoading = true;
  isAdmin = false;
  userPage: number = 0;
  userPageSize: number = 4;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: CompanyUsersModalData,
    private userService: UserService,
    private toastService: ToastService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.loadUsers();
  }

  loadUsers(){
    this.isLoading = true;
    this.userService.getUsersByCompany(this.data.companyId).subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleActive(user: any) {
    if (user.active) {
      this.userService.deactivateUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error(err.error?.error ?? 'Hiba történt!')
      });
    } else {
      this.userService.activateUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error(err.error?.error ?? 'Hiba történt!')
      });
    }
  }

  get paginatedUsers(): any[] {
    const start = this.userPage * this.userPageSize;
    return this.users.slice(start, start + this.userPageSize);
  }

  get userTotalPages(): number{
    return Math.ceil(this.users.length / this.userPageSize);
  }

  resetPassword(user: any){
    //TODO
  }

  close(){
    this.dialogRef.close();
  }
}

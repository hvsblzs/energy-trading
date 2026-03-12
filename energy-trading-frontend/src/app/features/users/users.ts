import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, User } from 'lucide-angular';

@Component({
  selector: 'app-users',
  imports: [DatePipe, LucideAngularModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {

  // Icons
  readonly User = User;

  users: any[] = [];
  isLoading: boolean = true;
  isAdmin: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.loadUsers();
  }

  loadUsers(){
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => u.role === 'COMPANY_USER');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleActive(user: any){
    if(user.active){
      this.userService.deactivateUser(user.id).subscribe({
        next: () => {
          this.toastService.success('Felhasználó deaktiválva!');
          this.loadUsers();
        },
        error: (err) => this.toastService.error(err.error?.err ?? 'Hiba történt!')
      });
    }else{
      this.userService.activateUser(user.id).subscribe({
        next: () => {
          this.toastService.success('Felhasználó aktiválva!');
          this.loadUsers();
        },
        error: (err) => this.toastService.error(err.error?.err ?? 'Hiba történt!')
      });
    }
  }
}

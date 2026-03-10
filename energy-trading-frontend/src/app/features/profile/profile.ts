import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {

  currentUser: any = null;
  isLoading: boolean = true;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  getRoleBadgeClass(): string {
    switch(this.currentUser?.role) {
      case 'ADMIN': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'DISPATCHER': return 'bg-blue-900 text-blue-300 border-blue-700';
      default: return 'bg-green-900 text-green-300 border-green-700';
    }
  }

  getRoleLabel(): string {
    switch(this.currentUser?.role) {
      case 'ADMIN': return 'Adminisztrátor';
      case 'DISPATCHER': return 'Diszpécser';
      default: return 'Céges Felhasználó';
    }
  }
}
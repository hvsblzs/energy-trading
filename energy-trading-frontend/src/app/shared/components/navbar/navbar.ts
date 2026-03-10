import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit{

  currentUser: any = null;
  isAdminOrDispatcher: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ){}

  getRole(): string | null {
    return this.authService.getRole();
  }

  ngOnInit(): void {
    const role = this.authService.getRole();
      this.isAdminOrDispatcher = role === 'ADMIN' || role === 'DISPATCHER';
      this.userService.getMe().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
      
      // Websocket kredit frissítés
      this.userService.creditBalance$.subscribe(balance => {
        if(balance !== null && this.currentUser){
          this.currentUser = {...this.currentUser, creditBalance: balance};
          this.cdr.detectChanges();
        }
      })
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isDispatcher(): boolean {
    return this.getRole() === 'DISPATCHER';
  }

  isCompanyUser(): boolean {
    return this.getRole() === 'COMPANY_USER';  
  }
}

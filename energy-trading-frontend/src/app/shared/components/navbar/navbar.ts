import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { DecimalPipe } from '@angular/common';
import { WebSocketService } from '../../../core/services/websocket.service';
import { LucideAngularModule, CircleDollarSign, Zap } from 'lucide-angular';
import { InactivityService } from '../../../core/services/inactivity.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, DecimalPipe, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy{

  // Icons
  readonly CircleDollarSign = CircleDollarSign;
  readonly Zap = Zap;

  currentUser: any = null;
  isAdminOrDispatcher: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private webSocketService: WebSocketService,
    private inactivityService: InactivityService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ){}

  getRole(): string | null {
    return this.authService.getRole();
  }

  ngOnInit(): void {
    this.inactivityService.start();
    const role = this.authService.getRole();
    this.isAdminOrDispatcher = role === 'ADMIN' || role === 'DISPATCHER';
    
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.userService.creditBalance$.subscribe(balance => {
      if (balance !== null && this.currentUser) {
        this.currentUser = { ...this.currentUser, creditBalance: balance };
        this.cdr.detectChanges();
      }
    });

    // Kredit WebSocket subscription itt, nem a dashboardon
    const userId = this.authService.getUserId();
    const companyId = this.authService.getCompanyId();
    const isCompanyUser = role === 'COMPANY_USER';
    const isDispatcher = role === 'DISPATCHER';

    this.webSocketService.connect();

    if (isCompanyUser && companyId) {
      this.webSocketService.subscribe(`/topic/credits/${companyId}`, (message) => {
        this.userService.updateCreditBalance(parseFloat(message.creditBalance));
      });
    } else if (isDispatcher && userId) {
      this.webSocketService.subscribe(`/topic/credits/${userId}`, (message) => {
        this.userService.updateCreditBalance(parseFloat(message.creditBalance));
      });
    }
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

  ngOnDestroy(): void {
    this.inactivityService.stop();
  }
}

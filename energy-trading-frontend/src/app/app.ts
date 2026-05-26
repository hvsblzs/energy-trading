import {Component, OnInit} from '@angular/core';
import {Router, RouterOutlet, NavigationEnd, ResolveEnd} from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { TickerComponent } from './shared/components/ticker/ticker';
import { ToastComponent } from './shared/components/toast/toast';
import { LanguageService } from './core/services/language.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, TickerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComonent implements OnInit {
  
  showNavbar(): boolean {
    return !this.router.url.includes('/login');
  }

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private authService: AuthService
  ){
    this.languageService.init();
  }

  ngOnInit(): void {
    if (this.authService.isTokenExpired()) {
      this.authService.logout();
      this.router.navigate(['/login'], { queryParams: {reason: 'session_expired'}});
    }
  }
}

import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InactivityService {

  private timeout: any = null;
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 perc
  private events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  constructor(
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  start() {
    this.ngZone.runOutsideAngular(() => {
      this.events.forEach(event => {
        window.addEventListener(event, () => this.reset());
      });
    });
    this.reset();
  }

  stop() {
    if (this.timeout) clearTimeout(this.timeout);
    this.events.forEach(event => {
      window.removeEventListener(event, () => this.reset());
    });
  }

  private reset() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { reason: 'inactivity' } });
      });
    }, this.TIMEOUT_MS);
  }
}
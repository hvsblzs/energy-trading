import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { TickerComponent } from './shared/components/ticker/ticker';
import { ToastComponent } from './shared/components/toast/toast';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, TickerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComonent {

  showNavbar(): boolean{
    return !this.router.url.includes('/login');
  }

  constructor(private router: Router){}
}

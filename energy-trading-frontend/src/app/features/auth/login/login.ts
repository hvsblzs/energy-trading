import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Clock } from 'lucide-angular';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {

  readonly Clock = Clock;

  email: string = '';
  password: string = '';
  errorMessage: string = '';
  inactivityMessage: string = '';
  isLoading: boolean = false;
  showInactivityModal: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'inactivity') {
        this.showInactivityModal = true;
        this.inactivityMessage = '5 perc inaktivitás miatt automatikusan kijelentkeztünk.';
      } else if (params['reason'] === 'session_expired') {
        this.showInactivityModal = true;
        this.inactivityMessage = 'A munkamenete lejárt. Kérjük, jelentkezzen be újra.';
      }
    });
  }

  login(){
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.saveToken(
          response.token,
          response.role,
          response.userId,
          response.companyId
        );
        this.router.navigate(['/marketplace']);
      },
      error: (err) => {
        this.errorMessage = err.error?.error ?? 'Hibás email vagy jelszó';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }
}

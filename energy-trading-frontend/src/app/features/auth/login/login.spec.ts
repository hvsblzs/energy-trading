import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';
import { LanguageService } from '../../../core/services/language.service';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff, Clock, Lock } from 'lucide-angular';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;
  let errorServiceMock: any;
  let languageServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn().mockReturnValue(of({ token: 'test-token', role: 'DISPATCHER', userId: 1, companyId: null })),
      saveToken: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    activatedRouteMock = {
      queryParams: of({})
    };

    errorServiceMock = {
      getErrorMessage: vi.fn().mockReturnValue('Invalid credentials')
    };

    languageServiceMock = {
      currentLang: 'hu',
      toggle: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        FormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Eye, EyeOff, Clock, Lock })
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ErrorService, useValue: errorServiceMock },
        { provide: LanguageService, useValue: languageServiceMock },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Komponens inicializálás ───────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty email and password', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should initialize with isLoading false', () => {
    expect(component.isLoading).toBe(false);
  });

  it('should initialize with showPassword false', () => {
    expect(component.showPassword).toBe(false);
  });

  it('should initialize with empty errorMessage', () => {
    expect(component.errorMessage).toBe('');
  });

  it('should initialize with showInactivityModal false', () => {
    expect(component.showInactivityModal).toBe(false);
  });

  // ── Template elemek ───────────────────────────────────

  it('should render login button', () => {
    const button = fixture.debugElement.query(By.css('button[disabled]'));
    expect(button).toBeFalsy(); // nem disabled alapból
  });

  it('should render email input', () => {
    const emailInput = fixture.debugElement.query(By.css('input[type="email"]'));
    expect(emailInput).toBeTruthy();
  });

  it('should render password input by default', () => {
    const passwordInput = fixture.debugElement.query(By.css('input[type="password"]'));
    expect(passwordInput).toBeTruthy();
  });

  it('should not show error message initially', () => {
    const errorDiv = fixture.debugElement.query(By.css('.bg-red-900\\/50'));
    expect(errorDiv).toBeFalsy();
  });

  it('should not show inactivity modal initially', () => {
    const modal = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(modal).toBeFalsy();
  });

  // ── switchPasswordVisibility tesztek ──────────────────

  it('should toggle showPassword on switchPasswordVisibility', () => {
    expect(component.showPassword).toBe(false);
    component.switchPasswordVisibility();
    expect(component.showPassword).toBe(true);
  });

  it('should toggle password input type when showPassword changes', async () => {
    component.switchPasswordVisibility();
    fixture.detectChanges();
    await fixture.whenStable();

    const textInput = fixture.debugElement.query(By.css('input[type="text"]'));
    expect(textInput).toBeTruthy();
  });

  // ── login tesztek ─────────────────────────────────────

  it('should call authService.login with email and password', () => {
    component.email = 'test@test.com';
    component.password = 'password123';

    component.login();

    expect(authServiceMock.login).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('should call authService.saveToken on successful login', () => {
    component.email = 'test@test.com';
    component.password = 'password123';

    component.login();

    expect(authServiceMock.saveToken).toHaveBeenCalledWith('test-token', 'DISPATCHER', 1, null);
  });

  it('should navigate to marketplace on successful login', () => {
    component.login();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/marketplace']);
  });

  it('should set errorMessage on failed login', () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({ error: { error: 'INVALID_CREDENTIALS' } })));

    component.login();

    expect(component.errorMessage).toBe('Invalid credentials');
  });

  it('should show error message in template on failed login', async () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({ error: { error: 'INVALID_CREDENTIALS' } })));

    component.login();
    fixture.detectChanges();
    await fixture.whenStable();

    const errorDiv = fixture.debugElement.query(By.css('.bg-red-900\\/50'));
    expect(errorDiv).toBeTruthy();
  });

  it('should set isLoading to false after failed login', () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({ error: {} })));

    component.login();

    expect(component.isLoading).toBe(false);
  });

  // ── inactivity modal tesztek ──────────────────────────

  it('should show inactivity modal when reason is inactivity', () => {
    activatedRouteMock.queryParams = of({ reason: 'inactivity' });
    component.ngOnInit();

    expect(component.showInactivityModal).toBe(true);
    expect(component.inactivityReason).toBe('inactivity');
  });

  it('should show inactivity modal when reason is session_expired', () => {
    activatedRouteMock.queryParams = of({ reason: 'session_expired' });
    component.ngOnInit();

    expect(component.showInactivityModal).toBe(true);
    expect(component.inactivityReason).toBe('session_expired');
  });

  it('should show inactivity modal when reason is password_changed', () => {
    activatedRouteMock.queryParams = of({ reason: 'password_changed' });
    component.ngOnInit();

    expect(component.showInactivityModal).toBe(true);
    expect(component.inactivityReason).toBe('password_changed');
  });

  it('should close inactivity modal when ok button clicked', async () => {
    component.showInactivityModal = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // A modal-on belüli gombot keressük a fixed overlay-en belül
    const modal = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(modal).toBeTruthy();

    const okButton = modal.query(By.css('button'));
    expect(okButton).toBeTruthy();

    okButton.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showInactivityModal).toBe(false);
  });
});
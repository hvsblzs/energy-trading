import { TestBed } from '@angular/core/testing';
import { ErrorService } from './error.service';
import { TranslateService } from '@ngx-translate/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ErrorService', () => {
  let service: ErrorService;
  let translateServiceMock: any;

  beforeEach(() => {
    translateServiceMock = {
      instant: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ErrorService,
        { provide: TranslateService, useValue: translateServiceMock }
      ]
    });

    service = TestBed.inject(ErrorService);
  });

  // ── getErrorMessage tesztek ───────────────────────────

  it('should return generic error when err is null', () => {
    translateServiceMock.instant.mockReturnValue('General error');

    const result = service.getErrorMessage(null);

    expect(result).toBe('General error');
    expect(translateServiceMock.instant).toHaveBeenCalledWith('errors.GENERIC');
  });

  it('should return generic error when err has no error code', () => {
    translateServiceMock.instant.mockReturnValue('General error');

    const result = service.getErrorMessage({ error: {} });

    expect(result).toBe('General error');
    expect(translateServiceMock.instant).toHaveBeenCalledWith('errors.GENERIC');
  });

  it('should return generic error when err is undefined', () => {
    translateServiceMock.instant.mockReturnValue('General error');

    const result = service.getErrorMessage(undefined);

    expect(result).toBe('General error');
    expect(translateServiceMock.instant).toHaveBeenCalledWith('errors.GENERIC');
  });

  it('should return translated error message when code exists', () => {
    translateServiceMock.instant.mockImplementation((key: string) => {
      if (key === 'errors.INSUFFICIENT_CREDIT_BUY') return 'Insufficient credit';
      return key;
    });

    const result = service.getErrorMessage({ error: { error: 'INSUFFICIENT_CREDIT_BUY' } });

    expect(result).toBe('Insufficient credit');
    expect(translateServiceMock.instant).toHaveBeenCalledWith('errors.INSUFFICIENT_CREDIT_BUY');
  });

  it('should return generic error when translation key not found', () => {
    // Ha a fordítás nem található, a translate.instant visszaadja a kulcsot
    translateServiceMock.instant.mockImplementation((key: string) => {
      if (key === 'errors.GENERIC') return 'General error';
      return key; // Nem található fordítás -> visszaadja a kulcsot
    });

    const result = service.getErrorMessage({ error: { error: 'UNKNOWN_ERROR_CODE' } });

    expect(result).toBe('General error');
    expect(translateServiceMock.instant).toHaveBeenCalledWith('errors.UNKNOWN_ERROR_CODE');
    expect(translateServiceMock.instant).toHaveBeenCalledWith('errors.GENERIC');
  });

  it('should return correct translation for EMAIL_ALREADY_EXISTS error', () => {
    translateServiceMock.instant.mockImplementation((key: string) => {
      if (key === 'errors.EMAIL_ALREADY_EXISTS') return 'Email already exists';
      return key;
    });

    const result = service.getErrorMessage({ error: { error: 'EMAIL_ALREADY_EXISTS' } });

    expect(result).toBe('Email already exists');
  });

  it('should return correct translation for RESOURCE_ALREADY_EXISTS error', () => {
    translateServiceMock.instant.mockImplementation((key: string) => {
      if (key === 'errors.RESOURCE_ALREADY_EXISTS') return 'Resource already exists';
      return key;
    });

    const result = service.getErrorMessage({ error: { error: 'RESOURCE_ALREADY_EXISTS' } });

    expect(result).toBe('Resource already exists');
  });
});
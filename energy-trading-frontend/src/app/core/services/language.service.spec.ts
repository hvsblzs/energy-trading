import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TranslateService } from '@ngx-translate/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateServiceMock: any;

  beforeEach(() => {
    translateServiceMock = {
      currentLang: 'hu',
      defaultLang: 'hu',
      use: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translateServiceMock }
      ]
    });

    service = TestBed.inject(LanguageService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── currentLang tesztek ───────────────────────────────

  it('should return currentLang from translateService', () => {
    translateServiceMock.currentLang = 'en';

    expect(service.currentLang).toBe('en');
  });

  it('should return defaultLang when currentLang is not set', () => {
    translateServiceMock.currentLang = undefined;
    translateServiceMock.defaultLang = 'hu';

    expect(service.currentLang).toBe('hu');
  });

  it('should return hu as fallback when both currentLang and defaultLang are not set', () => {
    translateServiceMock.currentLang = undefined;
    translateServiceMock.defaultLang = undefined;

    expect(service.currentLang).toBe('hu');
  });

  // ── toggle tesztek ────────────────────────────────────

  it('should toggle from hu to en', () => {
    translateServiceMock.currentLang = 'hu';

    service.toggle();

    expect(translateServiceMock.use).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('should toggle from en to hu', () => {
    translateServiceMock.currentLang = 'en';

    service.toggle();

    expect(translateServiceMock.use).toHaveBeenCalledWith('hu');
    expect(localStorage.getItem('lang')).toBe('hu');
  });

  it('should save toggled language to localStorage', () => {
    translateServiceMock.currentLang = 'hu';

    service.toggle();

    expect(localStorage.getItem('lang')).toBe('en');
  });

  // ── init tesztek ──────────────────────────────────────

  it('should use saved language from localStorage on init', () => {
    localStorage.setItem('lang', 'en');

    service.init();

    expect(translateServiceMock.use).toHaveBeenCalledWith('en');
  });

  it('should use hu as default when no language saved in localStorage', () => {
    service.init();

    expect(translateServiceMock.use).toHaveBeenCalledWith('hu');
  });

  it('should use hu when localStorage lang is null', () => {
    localStorage.removeItem('lang');

    service.init();

    expect(translateServiceMock.use).toHaveBeenCalledWith('hu');
  });
});
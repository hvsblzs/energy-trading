import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InactivityService } from './inactivity.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NgZone } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('InactivityService', () => {
  let service: InactivityService;
  let routerMock: any;
  let authServiceMock: any;
  let ngZoneMock: any;

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn()
    };

    authServiceMock = {
      logout: vi.fn()
    };

    // NgZone mock - runOutsideAngular és run egyből meghívja a callback-et
    ngZoneMock = {
      runOutsideAngular: vi.fn((fn: () => void) => fn()),
      run: vi.fn((fn: () => void) => fn())
    };

    TestBed.configureTestingModule({
      providers: [
        InactivityService,
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NgZone, useValue: ngZoneMock }
      ]
    });

    service = TestBed.inject(InactivityService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── start tesztek ─────────────────────────────────────

  it('should add event listeners on start', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    service.start();

    // 5 event listener kerül feliratkozásra
    expect(addEventListenerSpy).toHaveBeenCalledTimes(5);
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });

  it('should call runOutsideAngular on start', () => {
    service.start();

    expect(ngZoneMock.runOutsideAngular).toHaveBeenCalled();
  });

  // ── timeout tesztek ───────────────────────────────────

  it('should logout and navigate after 5 minutes of inactivity', () => {
    service.start();

    // 5 perc elteltével
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { reason: 'inactivity' } }
    );
  });

  it('should not logout before 5 minutes', () => {
    service.start();

    // 4 perc 59 másodperc
    vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);

    expect(authServiceMock.logout).not.toHaveBeenCalled();
  });

  it('should run logout inside Angular zone', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(ngZoneMock.run).toHaveBeenCalled();
  });

  // ── stop tesztek ──────────────────────────────────────

  it('should clear timeout on stop', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    service.start();
    service.stop();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should not logout after stop', () => {
    service.start();
    service.stop();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authServiceMock.logout).not.toHaveBeenCalled();
  });

  it('should remove event listeners on stop', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    service.stop();

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(5);
  });
});
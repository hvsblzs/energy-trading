import { TestBed } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });

    service = TestBed.inject(ToastService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── success tesztek ───────────────────────────────────

  it('should add success toast', () => {
    service.success('Operation successful');

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Operation successful');
      expect(toasts[0].type).toBe('success');
    });
  });

  it('should assign id to success toast', () => {
    service.success('Test message');

    service.toasts.subscribe(toasts => {
      expect(toasts[0].id).toBeDefined();
      expect(typeof toasts[0].id).toBe('number');
    });
  });

  // ── error tesztek ─────────────────────────────────────

  it('should add error toast', () => {
    service.error('Something went wrong');

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Something went wrong');
      expect(toasts[0].type).toBe('error');
    });
  });

  // ── multiple toasts tesztek ───────────────────────────

  it('should add multiple toasts', () => {
    service.success('First message');
    service.error('Second message');

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(2);
      expect(toasts[0].type).toBe('success');
      expect(toasts[1].type).toBe('error');
    });
  });

  it('should assign incrementing ids to toasts', () => {
    service.success('First');
    service.success('Second');

    service.toasts.subscribe(toasts => {
      expect(toasts[0].id).toBe(0);
      expect(toasts[1].id).toBe(1);
    });
  });

  // ── remove tesztek ────────────────────────────────────

  it('should remove toast by id', () => {
    service.success('Test message');

    let toastId: number;
    service.toasts.subscribe(toasts => {
      if (toasts.length > 0) toastId = toasts[0].id;
    });

    service.remove(toastId!);

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(0);
    });
  });

  it('should only remove toast with matching id', () => {
    service.success('First');
    service.success('Second');

    service.remove(0);

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Second');
    });
  });

  // ── auto-remove tesztek ───────────────────────────────

  it('should auto-remove toast after 5 seconds', () => {
    service.success('Auto remove test');

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(1);
    });

    vi.advanceTimersByTime(5000);

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(0);
    });
  });

  it('should not remove toast before 5 seconds', () => {
    service.success('Not yet removed');

    vi.advanceTimersByTime(4999);

    service.toasts.subscribe(toasts => {
      expect(toasts.length).toBe(1);
    });
  });

  // ── toasts observable tesztek ─────────────────────────

  it('should initialize with empty toasts', () => {
    service.toasts.subscribe(toasts => {
      expect(toasts).toEqual([]);
    });
  });
});
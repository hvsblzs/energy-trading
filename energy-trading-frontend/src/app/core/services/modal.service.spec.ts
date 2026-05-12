import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Dummy komponens a teszthez
@Component({ template: '' })
class TestComponent {}

describe('ModalService', () => {
  let service: ModalService;
  let dialogMock: any;
  let overlayMock: any;
  let mockDialogRef: any;
  let mockPositionStrategy: any;

  beforeEach(() => {
    // Position strategy lánc mock-ja
    mockPositionStrategy = {
      centerHorizontally: vi.fn().mockReturnThis(),
      centerVertically: vi.fn().mockReturnThis()
    };

    mockDialogRef = { close: vi.fn() };

    dialogMock = {
      open: vi.fn().mockReturnValue(mockDialogRef)
    };

    overlayMock = {
      position: vi.fn().mockReturnValue({
        global: vi.fn().mockReturnValue(mockPositionStrategy)
      })
    };

    TestBed.configureTestingModule({
      providers: [
        ModalService,
        { provide: Dialog, useValue: dialogMock },
        { provide: Overlay, useValue: overlayMock }
      ]
    });

    service = TestBed.inject(ModalService);
  });

  // ── open tesztek ──────────────────────────────────────

  it('should call dialog.open with component', () => {
    service.open(TestComponent);

    expect(dialogMock.open).toHaveBeenCalledWith(
      TestComponent,
      expect.objectContaining({ panelClass: 'modal-panel' })
    );
  });

  it('should call dialog.open with correct panel and backdrop classes', () => {
    service.open(TestComponent);

    expect(dialogMock.open).toHaveBeenCalledWith(
      TestComponent,
      expect.objectContaining({
        panelClass: 'modal-panel',
        backdropClass: 'modal-backdrop'
      })
    );
  });

  it('should call dialog.open with correct minWidth', () => {
    service.open(TestComponent);

    expect(dialogMock.open).toHaveBeenCalledWith(
      TestComponent,
      expect.objectContaining({ minWidth: '360px' })
    );
  });

  it('should pass data to dialog.open', () => {
    const testData = { id: 1, name: 'Test' };

    service.open(TestComponent, testData);

    expect(dialogMock.open).toHaveBeenCalledWith(
      TestComponent,
      expect.objectContaining({ data: testData })
    );
  });

  it('should pass undefined data when no data provided', () => {
    service.open(TestComponent);

    expect(dialogMock.open).toHaveBeenCalledWith(
      TestComponent,
      expect.objectContaining({ data: undefined })
    );
  });

  it('should return DialogRef', () => {
    const ref = service.open(TestComponent);

    expect(ref).toBe(mockDialogRef);
  });

  it('should use overlay position strategy', () => {
    service.open(TestComponent);

    expect(overlayMock.position).toHaveBeenCalled();
    expect(mockPositionStrategy.centerHorizontally).toHaveBeenCalled();
    expect(mockPositionStrategy.centerVertically).toHaveBeenCalled();
  });
});
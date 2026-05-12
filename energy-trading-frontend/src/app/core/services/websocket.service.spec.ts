import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      active: false,
      activate: vi.fn(),
      deactivate: vi.fn(),
      subscribe: vi.fn(),
      config: {}
    };

    TestBed.configureTestingModule({
      providers: [WebSocketService]
    });

    service = TestBed.inject(WebSocketService);

    // Client konstruktor mock-ja - lecseréljük a connect() által létrehozott client-et
    vi.spyOn(service as any, 'connect').mockImplementation(() => {
      service['connectionCount']++;
      if (!service['client']) {
        service['client'] = mockClient;
        mockClient.activate();
      }
    });
  });

  // ── kezdeti állapot tesztek ───────────────────────────

  it('should initialize with null client', () => {
    expect(service['client']).toBeNull();
  });

  it('should initialize with false connected', () => {
    expect(service['connected']).toBe(false);
  });

  it('should initialize with 0 connectionCount', () => {
    expect(service['connectionCount']).toBe(0);
  });

  it('should initialize with empty subscriptionQueue', () => {
    expect(service['subscriptionQueue']).toEqual([]);
  });

  // ── connect tesztek ───────────────────────────────────

  it('should increment connectionCount on connect', () => {
    service.connect();
    expect(service['connectionCount']).toBe(1);
  });

  it('should increment connectionCount on multiple connects', () => {
    service.connect();
    service.connect();
    expect(service['connectionCount']).toBe(2);
  });

  it('should create client on first connect', () => {
    service.connect();
    expect(service['client']).not.toBeNull();
  });

  it('should activate client on connect', () => {
    service.connect();
    expect(mockClient.activate).toHaveBeenCalledTimes(1);
  });

  it('should set connected to true manually', () => {
    service['connected'] = true;
    expect(service['connected']).toBe(true);
  });

  it('should set connected to false manually', () => {
    service['connected'] = true;
    service['connected'] = false;
    expect(service['connected']).toBe(false);
  });

  // ── disconnect tesztek ────────────────────────────────

  it('should decrement connectionCount on disconnect', () => {
    service.connect();
    service.disconnect();
    expect(service['connectionCount']).toBe(0);
  });

  it('should not go below 0 connectionCount', () => {
    service.connect();
    service.disconnect();
    service.disconnect();
    expect(service['connectionCount']).toBe(0);
  });

  it('should reset connected to false on full disconnect', () => {
    service.connect();
    service['connected'] = true;
    mockClient.active = true;
    service.disconnect();
    expect(service['connected']).toBe(false);
  });

  // ── subscribe tesztek ─────────────────────────────────

  it('should add to queue when not connected', () => {
    const callback = vi.fn();
    service.subscribe('/topic/test', callback);

    expect(service['subscriptionQueue'].length).toBe(1);
    expect(service['subscriptionQueue'][0].topic).toBe('/topic/test');
    expect(service['subscriptionQueue'][0].callback).toBe(callback);
  });

  it('should add multiple topics to queue when not connected', () => {
    service.subscribe('/topic/first', vi.fn());
    service.subscribe('/topic/second', vi.fn());

    expect(service['subscriptionQueue'].length).toBe(2);
  });

  it('should subscribe directly when connected', () => {
    service.connect();
    service['connected'] = true;

    const callback = vi.fn();
    service.subscribe('/topic/test', callback);

    expect(mockClient.subscribe).toHaveBeenCalledWith(
      '/topic/test',
      expect.any(Function)
    );
    expect(service['subscriptionQueue'].length).toBe(0);
  });

  // ── flushQueue tesztek ────────────────────────────────

  it('should flush queue on connect', () => {
    const callback = vi.fn();
    service.subscribe('/topic/test', callback);
    expect(service['subscriptionQueue'].length).toBe(1);

    service.connect();
    service['connected'] = true;
    service['flushQueue']();

    expect(service['subscriptionQueue'].length).toBe(0);
  });

  it('should call client.subscribe for each queued topic on flush', () => {
    service.connect();
    service['client'] = mockClient;
    service.subscribe('/topic/first', vi.fn());
    service.subscribe('/topic/second', vi.fn());

    service['connected'] = true;
    service['flushQueue']();

    expect(mockClient.subscribe).toHaveBeenCalledTimes(2);
  });
});
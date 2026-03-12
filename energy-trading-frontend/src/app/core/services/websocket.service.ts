import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private client: Client | null = null;
  private connected: boolean = false;
  private connectionCount: number = 0;
  private subscriptionQueue: { topic: string, callback: (message: any) => void }[] = [];

  connect() {
    this.connectionCount++;
    if (this.client?.active) {
      if (this.connected) {
        this.flushQueue();
      }
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        this.flushQueue();
      },
      onDisconnect: () => {
        this.connected = false;
      }
    });

    this.client.activate();
  }

  private flushQueue() {
    this.subscriptionQueue.forEach(({ topic, callback }) => {
      this.client!.subscribe(topic, (message) => {
        callback(JSON.parse(message.body));
      });
    });
    this.subscriptionQueue = [];
  }

  disconnect() {
    this.connectionCount--;
    if (this.connectionCount <= 0 && this.client?.active) {
      this.client.deactivate();
      this.connected = false;
      this.connectionCount = 0;
    }
  }

  subscribe(topic: string, callback: (message: any) => void): void {
    if (this.connected && this.client) {
      this.client.subscribe(topic, (message) => {
        callback(JSON.parse(message.body));
      });
    } else {
      this.subscriptionQueue.push({ topic, callback });
    }
  }
}
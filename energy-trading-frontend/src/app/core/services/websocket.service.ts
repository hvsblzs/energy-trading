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
    if (this.client?.active) return;

    this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        onConnect: () => {
        this.connected = true;
        console.log('WebSocket connected');
        this.subscriptionQueue.forEach(({ topic, callback }) => {
            this.client!.subscribe(topic, (message) => {
            callback(JSON.parse(message.body));
            });
        });
        this.subscriptionQueue = [];
        },
        onDisconnect: () => {
        this.connected = false;
        console.log('WebSocket disconnected');
        }
    });

    this.client.activate();
    }

    disconnect() {
    this.connectionCount--;
    if (this.connectionCount <= 0 && this.client?.active) {
        this.client.deactivate();
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
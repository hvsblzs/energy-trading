import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TradeOfferService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  createTradeOffer(request: { resourceType: string, offerType: string, quantity: number }) {
    return this.http.post<any>(`${this.apiUrl}/trade-offers`, request);
  }

  getPendingTradeOffers(){
    return this.http.get<any[]>(`${this.apiUrl}/trade-offers/pending`);
  }

  approveTradeOffer(id: number){
    return this.http.put<any>(`${this.apiUrl}/trade-offers/${id}/approve`, {});
  }

  rejectTradeOffer(id: number, notes: string){
    return this.http.put<any>(`${this.apiUrl}/trade-offers/${id}/reject?notes=${notes}`, {});
  }

  getTradeHistory(params: {
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
    status?: string;
    offerType?: string;
    resourceType?: string;
    search?: string
  }) {
    let query = `page=${params.page ?? 0}&size=${params.size ?? 10}&sort=${params.sort ?? 'createdAt'}&direction=${params.direction ?? 'desc'}`;
    if (params.status) query += `&status=${params.status}`;
    if (params.offerType) query += `&offerType=${params.offerType}`;
    if (params.resourceType) query += `&resourceType=${params.resourceType}`;
    if (params.search) query += `&search=${params.search}`;
    return this.http.get<any>(`${this.apiUrl}/trade-offers/history?${query}`);
  }
}
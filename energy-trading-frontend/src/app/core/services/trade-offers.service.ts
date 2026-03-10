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

}
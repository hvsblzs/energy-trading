import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PricingService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCurrentPrice(resourceType: string) {
    return this.http.get<any>(`${this.apiUrl}/pricings/${resourceType}`);
  }

  setPrice(request: any){
    return this.http.post<any>(`${this.apiUrl}/pricings`, request);
  }

  getAllPrices(){
    return this.http.get<any[]>(`${this.apiUrl}/pricings/all`);
  }
}
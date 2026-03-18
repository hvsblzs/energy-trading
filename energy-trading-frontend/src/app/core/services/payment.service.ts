import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root'})
export class PaymentService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient){}

  createPaymentIntent(amount: number){
    return this.http.post<any>(`${this.apiUrl}/payments/create-payment-intent`, {amount});
  }
}
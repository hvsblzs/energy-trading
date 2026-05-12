import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment'; 

@Injectable({ providedIn: 'root'})
export class PaymentService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient){}

  createPaymentIntent(amount: number){
    return this.http.post<any>(`${this.apiUrl}/payments/create-payment-intent`, {amount});
  }
}
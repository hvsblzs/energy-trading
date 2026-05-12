import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment'; 

@Injectable({
    providedIn: 'root'
})
export class TransactionService{

    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient){}

    getRecentTransactions(){
        return this.http.get<any[]>(`${this.apiUrl}/transactions/recent`);
    }

    getStats(period: 'DAILY' | 'WEEKLY'){
        return this.http.get<any[]>(`${this.apiUrl}/transactions/stats?period=${period}`);
    }
}
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class CompanyInventoryService{

    private apiUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient){}

    getMyInventory(){
        return this.http.get<any[]>(`${this.apiUrl}/company-inventory/me`);
    }
}
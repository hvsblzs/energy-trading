import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment'; 

@Injectable({ providedIn: 'root' })
export class CompanyInventoryService{

    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient){}

    getMyInventory(){
        return this.http.get<any[]>(`${this.apiUrl}/company-inventory/me`);
    }
}
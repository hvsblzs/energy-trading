import { Injectable, resource } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class CentralStorageService {

    private apiUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient){}

    getStorage(resourceType: string){
        return this.http.get<any>(`${this.apiUrl}/central_storage/${resourceType}`);
    }

    getAllStorage(){
        return this.http.get<any[]>(`${this.apiUrl}/central_storage`);
    }

    addQuantity(resourceType: string, quantity: number){
        return this.http.patch<any>(`${this.apiUrl}/central_storage/${resourceType}/add`, {quantity});
    }

    updateMaxQuantity(resourceType: string, maxQuantity: number){
        return this.http.patch<any>(`${this.apiUrl}/central_storage/${resourceType}/max-quantity`, {maxQuantity});
    }
}
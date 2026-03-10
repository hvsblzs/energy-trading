import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class ResourceTypeService {
    
    private apiUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient){}

    getAllResourceTypes() {
        return this.http.get<any[]>(`${this.apiUrl}/resource-types`);
    }
}
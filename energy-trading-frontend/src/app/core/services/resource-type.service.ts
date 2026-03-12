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

    createResourceType(request: any){
        return this.http.post<any>(`${this.apiUrl}/resource-types`, request);
    }

    deleteResourceType(id: number) {
        return this.http.delete(`${this.apiUrl}/resource-types/${id}`);
    }
}
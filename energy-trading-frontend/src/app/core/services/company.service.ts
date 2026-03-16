import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root'})
export class CompanyService {

    private apiUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient){}

    getAllCompanies(params: {
        page?: number,
        size?: number,
        sort?: string,
        direction?: string,
        search?: string,
        active?: boolean | null
    } = {}) {
        const { page = 0, size = 10, sort = 'name', direction = 'asc', search = '', active } = params;
        let queryParams: any = { page, size, sort, direction, search };
        if (active !== null && active !== undefined) queryParams.active = active;
        return this.http.get<any>(`${this.apiUrl}/companies`, { params: queryParams });
    }

    getCompanyById(id: number) {
        return this.http.get<any>(`${this.apiUrl}/companies/${id}`);
    }

    createCompany(request: any){
        return this.http.post<any>(`${this.apiUrl}/companies`, request);
    }

    updateCompany(id: number, request: any){
        return this.http.put<any>(`${this.apiUrl}/companies/${id}`, request);
    }

    activateCompany(id: number) {
        return this.http.patch<void>(`${this.apiUrl}/companies/${id}/activate`, {});
    }

    deactivateCompany(id: number) {
        return this.http.patch<void>(`${this.apiUrl}/companies/${id}/deactivate`, {});
    }

    createCompanyWithUser(request: any){
        return this.http.post<any>(`${this.apiUrl}/companies/with-user`, request);
    }

    deleteCompany(id: number){
        return this.http.delete(`${this.apiUrl}/companies/${id}`);
    }
}
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";

@Injectable({providedIn: 'root'})
export class UserService {
    
    private apiUrl = 'http://localhost:8080/api';
    creditBalance$ = new BehaviorSubject<number | null>(null);

    constructor(private http: HttpClient){}

    updateCreditBalance(balance: number){
        this.creditBalance$.next(balance);
    }

    getMe(){
        return this.http.get<any>(`${this.apiUrl}/users/me`);
    }

    getAllUsers(params: {
        page?: number,
        size?: number,
        sort?: string,
        direction?: string,
        search?: string,
        active?: boolean | null
    } = {}) {
        const {page = 0, size = 10, sort = 'email', direction = 'asc', search = '', active} = params;
        let queryParams: any = {page, size, sort, direction, search};
        if(active !== null && active !== undefined) queryParams.active = active;
        return this.http.get<any>(`${this.apiUrl}/users`, {params: queryParams});
    }

    createUser(request: any) {
        return this.http.post<any>(`${this.apiUrl}/users`, request);
    }

    updateUser(id: number, request: any) {
        return this.http.put<any>(`${this.apiUrl}/users/${id}`, request);
    }

    activateUser(id: number) {
        return this.http.patch<void>(`${this.apiUrl}/users/${id}/activate`, {});
    }

    deactivateUser(id: number) {
        return this.http.patch<void>(`${this.apiUrl}/users/${id}/deactivate`, {});
    }

    createUserForCompany(companyId: number, request: any){
        return this.http.post<any>(`${this.apiUrl}/users/companies/${companyId}/users`, request);
    }

    getUsersByCompany(companyId: number){
        return this.http.get<any[]>(`${this.apiUrl}/users/companies/${companyId}`);
    }
}
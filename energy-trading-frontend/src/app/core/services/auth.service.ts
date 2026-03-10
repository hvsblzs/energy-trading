import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private router: Router){}

  login(email: string, password: string){
    return this.http.post<any>(`${this.apiUrl}/auth/login`, {email, password});
  }

  saveToken(token: string, role: string, userId: number, companyId: number | null){
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId.toString());
    if(companyId){
      localStorage.setItem('companyId', companyId.toString());
    }
  }

  getCompanyId(): number | null{
    const companyId = localStorage.getItem('companyId');
    return companyId ? parseInt(companyId) : null;
  } 

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole() : string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return this.getToken() != null;
  }

  getUserId(): number | null{
    const token = this.getToken();
    if(!token) return null;
    try{
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId ?? null;
    }catch{
      return null;
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}

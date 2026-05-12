import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class CompanyResourcesService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyResources() {
    return this.http.get<any[]>(`${this.apiUrl}/company-resources/me`);
  }

  getResourcesByCompany(companyId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/company-resources/company/${companyId}`);
  }

  addResource(companyId: number, resourceTypeId: number) {
    return this.http.post<void>(`${this.apiUrl}/company-resources/company/${companyId}/resource/${resourceTypeId}`, {});
  }

  removeResource(companyId: number, resourceTypeId: number) {
    return this.http.delete<void>(`${this.apiUrl}/company-resources/company/${companyId}/resource/${resourceTypeId}`);
  }
}
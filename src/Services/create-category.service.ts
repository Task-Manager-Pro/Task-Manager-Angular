import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from './enviroment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CreateCategoryService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<any[]> {
    const url = `${environment.apiBaseUrl}/api/CategorieTaskManager`;
    return this.http.get<any>(url).pipe(
      map((response) => (Array.isArray(response) ? response : response?.value ?? [])),
      catchError((error) => {
        console.error('Erro ao listar categorias:', error);
        return throwError(error);
      })
    );
  }

  createCategory(newCategory: any): Observable<any> {
    const url = `${environment.apiBaseUrl}/api/CategorieTaskManager/CreateCategorieTask`;

    return this.http.post(url, newCategory).pipe(
      map((response) => response),
      catchError((error) => {
        console.error('Erro ao criar categoria:', error);
        return throwError(error);
      })
    );
  }
}


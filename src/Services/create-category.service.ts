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


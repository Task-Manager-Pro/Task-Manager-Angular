import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './enviroment';

@Injectable({
  providedIn: 'root',
})
export class TasksToDoService {
  constructor(private http: HttpClient) {}

  getTasksToDo(): Observable<any> {
    const url = `${environment.apiBaseUrl}/TasksToDo`;
    return this.http.get(url);
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from './enviroment';
import { BoardTasksResponseDto, TaskDto } from 'src/Interfaces/task-dto.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getBoardTasks(boardId: number): Observable<BoardTasksResponseDto> {
    return this.http.get<BoardTasksResponseDto | { value: TaskDto[] }>(`${this.baseUrl}/boards/${boardId}/tasks`).pipe(
      map((response) => {
        if ('columns' in response && 'tasks' in response) {
          return response;
        }

        const tasks = response.value ?? [];
        const defaultColumns = this.buildColumnsFromTasks(tasks);

        return {
          boardId,
          columns: defaultColumns,
          tasks
        };
      })
    );
  }

  patchTask(taskId: number, patchDto: Partial<TaskDto>, rowVersion: string): Observable<TaskDto> {
    const payload = {
      ...patchDto,
      rowVersion
    };

    return this.http.patch<TaskDto>(`${this.baseUrl}/tasks/${taskId}`, payload, {
      headers: this.concurrencyHeaders(rowVersion)
    });
  }

  moveTask(taskId: number, targetColumnId: string, targetOrder: number, rowVersion: string): Observable<TaskDto> {
    const moveBody = {
      targetColumnId,
      targetOrder,
      rowVersion
    };

    return this.http.post<TaskDto>(`${this.baseUrl}/tasks/${taskId}/move`, moveBody, {
      headers: this.concurrencyHeaders(rowVersion)
    }).pipe(
      catchError((error) => {
        if (error?.status === 404 || error?.status === 405) {
          return this.patchTask(taskId, { columnId: targetColumnId, order: targetOrder }, rowVersion);
        }

        return throwError(() => error);
      })
    );
  }

  getTaskById(taskId: number): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.baseUrl}/tasks/${taskId}`);
  }

  private concurrencyHeaders(rowVersion: string): HttpHeaders {
    return new HttpHeaders({
      'If-Match': rowVersion
    });
  }

  private buildColumnsFromTasks(tasks: TaskDto[]) {
    const fallbackOrder = ['todo', 'doing', 'done'];
    const existing = Array.from(new Set(tasks.map((task) => task.columnId || 'todo')));
    const ids = existing.length >= 3 ? existing : fallbackOrder;

    return ids.map((id, index) => ({
      id,
      name: id,
      order: index
    }));
  }
}

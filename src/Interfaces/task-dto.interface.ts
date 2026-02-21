export interface TaskDto {
  id: number;
  title: string;
  description: string;
  columnId: string;
  order: number;
  rowVersion: string;
  estimateMinutes?: number | null;
  spentMinutes?: number | null;
  dueDate?: string | null;
  updatedAt?: string;
}

export interface BoardColumnDto {
  id: string;
  name: string;
  order: number;
}

export interface BoardTasksResponseDto {
  boardId: number;
  columns: BoardColumnDto[];
  tasks: TaskDto[];
}

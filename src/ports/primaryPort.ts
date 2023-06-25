import { AddTaskCommand, CompleteTaskCommand, CreateTodoListCommand } from "../application/domain/command";
import { TodoList, TodoTask } from "../application/domain/aggregate";

 export interface ITodoService {
    createTodoList(c: CreateTodoListCommand): TodoList | undefined;
    getTodoList(id: string): TodoList | undefined;
    addTask(c: AddTaskCommand): TodoTask | undefined;
    completeTask(c: CompleteTaskCommand): void;
}

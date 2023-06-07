import { ITask, ITodoList } from "../application/domain";

export interface ITodoService {
    createTodoList(list: ITodoList): ITodoList | undefined;
    getTodoList(id: number): ITodoList | undefined;
    addTask(todoListId: number, task: ITask): ITask | undefined;
    completeTask(task: ITask, todoListId: number): void;
}
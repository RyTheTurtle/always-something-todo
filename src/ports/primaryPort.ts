import { ITask, ITodoList } from "../application/domain";

export interface ITodoService {
    createTodoList(list: ITodoList): ITodoList | undefined;
    getTodoList(id: string): ITodoList | undefined;
    addTask(todoListId: string, task: ITask): ITask | undefined;
    completeTask(task: ITask, todoListId: string): void;
}

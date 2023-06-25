import { TodoList } from "../application/domain/aggregate";

export interface ITodoRepository {
    read(list_id: string): TodoList | undefined;
    save(list: TodoList): undefined;
}

import { ITodoList } from "../application/domain";

export interface ITodoRepository {
    create(list: ITodoList): ITodoList | undefined;
    read(id: number): ITodoList | undefined;
    update(list: ITodoList): ITodoList | undefined;
}

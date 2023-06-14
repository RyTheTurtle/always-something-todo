import { events, ITodoList } from "../application/domain";

export interface ITodoRepository {
    create(list: ITodoList): ITodoList | undefined;
    read(id: string): ITodoList | undefined;
    update(list: ITodoList): ITodoList | undefined;
}

export interface ITodoEventRepository {
    write(e: events.RegisteredEvent) : void;
    getTodoList(id: string): ITodoList | undefined;
}
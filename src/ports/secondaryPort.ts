import { ITodoList, RegisteredEvent } from "../application/domain";

export interface ITodoRepository {
    create(list: ITodoList): ITodoList | undefined;
    read(id: string): ITodoList | undefined;
    update(list: ITodoList): ITodoList | undefined;
}

export interface ITodoEventRepository {
    write(e: RegisteredEvent) : void;
    // FIXME separate reading and writing to different
    // interfaces. 
    getTodoList(id: string): ITodoList | undefined;
}
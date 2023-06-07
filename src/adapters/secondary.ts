import { v4 as uuidv4 } from "uuid";
import { ITodoList } from "../application/domain";
import { ITodoRepository } from "../ports/secondaryPort";

export class InMemoryRepo implements ITodoRepository {
    private data: Map<string, ITodoList>;

    constructor() {
        this.data = new Map<string, ITodoList>();
    }

    public create(list: ITodoList): ITodoList | undefined {
        list.id = uuidv4();
        this.data.set(list.id, list);
        return list;
    }

    public read(id: string): ITodoList | undefined {
        return this.data.get(id);
    }

    public update(list: ITodoList): ITodoList | undefined {
        if (list && list.id !== undefined) {
            this.data.set(list.id, list);
            return list;
        } else {
            return undefined;
        }
    }

}

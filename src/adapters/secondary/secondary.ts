import { v4 as uuidv4 } from "uuid"; 
import { ITodoRepository } from "../../ports/secondaryPort";
import { TodoList } from "../../application/domain/aggregate";

export class InMemoryRepo implements ITodoRepository {
    private data: Map<string, TodoList>;

    constructor() {
        this.data = new Map<string, TodoList>();
    }
    
    read(list_id: string): TodoList | undefined {
        return this.data.get(list_id);
    }

    save(list: TodoList): undefined {
        // for simplicity of lookups, also key it 
        this.data.set(list.title, list);
        this.data.set(list.id, list);
    }
}

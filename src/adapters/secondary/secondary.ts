import { v4 as uuidv4 } from "uuid"; 
import { ITodoRepository } from "../../ports/secondaryPort";
import { TodoList } from "../../application/domain/aggregate";

export class InMemoryRepo implements ITodoRepository {
    private data: Map<string, TodoList>;

    constructor() {
        this.data = new Map<string, TodoList>();
    }
    
    read(list_id: string): TodoList | undefined {
        return this.data.get(list_id)?.copy();
    }

    save(list: TodoList): undefined {
        // implement concurrency control here by checking 
        // the latest version in the "database" and seeing 
        // what events we actually need to persist from the
        // updated TodoList aggregate 
        if(this.data.has(list.id)){
            const oldList = this.read(list.id)
            const oldListVersion = (oldList?.version ?? -1)
            const listIsOutdated = oldListVersion >= list.version
            if(listIsOutdated){
                throw Error("concurrency exception") 
            }

            // just debugging purposes here 
            list.getChanges()
                .filter(c => c.version > (oldList?.version ?? 0))
                .forEach(change => {
                    console.log(`Persisting new event for list ${list.title}: \n\t${JSON.stringify(change)}`)
                })
        }
        // for simplicity of lookups, also key it 
        this.data.set(list.title, list);
        this.data.set(list.id, list);
    }
}

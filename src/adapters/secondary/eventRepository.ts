import { EventName, RegisteredEvent, TodoList, TodoListCreated } from "../../application/domain";
import { ITodoEventRepository } from "../../ports/secondaryPort";
// A simple in memory repository for persisting events and
// fetching todo lists from those events.

export class InMemoryEventRepo implements ITodoEventRepository {
    events: RegisteredEvent[];

    constructor() {
        this.events = [];
    }

    write(e: RegisteredEvent): void {
        this.events.push(e);
    }

    /**
     * Returns the current state of the ToDo list
     * requested by rehydrating the Todo list by
     * reading all of the events and applying the appropriate
     * transformations on the todo list object.
     *
     * @param id the name or ID of the todo list to load
     */
    public getTodoList(key: string): TodoList | undefined {
        let result: TodoList | undefined = undefined;
        this.events.map((e) => {
            // our first event for the event id that we're looking for should be
            // the first event for LIST_CREATED that has the name or ID matching
            // the key
            const isCreationEvent = (
                !result
                && e.event_name == EventName.LIST_CREATED
                && ((e as TodoListCreated).title === key
                    || (e as TodoListCreated).id === key
                   )
            );

            if (!result && isCreationEvent){
                result = new TodoList((e as TodoListCreated));
            } else if(result) {
                result.onEvent(e);
            }
        });
        return result;
    }

}
import { events } from "../../application/domain";
import { ITodoEventRepository } from "../../ports/secondaryPort";
// A simple in memory repository for persisting events and
// fetching todo lists from those events.

export class InMemoryEventRepo implements ITodoEventRepository {
    events: events.RegisteredEvent[];

    constructor() {
        this.events = [];
    }

    write(e: events.RegisteredEvent): void {
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
    public getTodoList(key: string): events.TodoList | undefined {
        let result: events.TodoList | undefined = undefined;
        this.events.map((e) => {
            // our first event for the event id that we're looking for should be
            // the first event for LIST_CREATED that has the name or ID matching
            // the key
            let isCreationEvent = (
                !result
                && e.event_name == events.EventName.LIST_CREATED
                && ((e as events.TodoListCreated).title === key
                    || (e as events.TodoListCreated).id === key
                   )
            );

            if (!result && isCreationEvent){
                result = new events.TodoList((e as events.TodoListCreated));
            }

            if (result){
                result.onEvent(e);
            }
        });
        return result;
    }

}
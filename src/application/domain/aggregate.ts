import { RegisteredEvent, TodoListCreated, EventName, TaskCompleted, Priority, TaskAddedToList } from "./event";
import {v4 as uuidv4} from "uuid";

/**
 * Aggregates are some projected state that is derived from events. To 'hydrate' a projection, 
 * relevant events are captured 
 */
abstract class IAggregate { 
    protected changes: RegisteredEvent[] = [];
    abstract id: string;
    abstract version: number;

    /**
     * apply takes an event and applies the changes to the projection 
     * accordingly. Implementations of IProjection will supply their own 
     * definitions for how to update the entity state when an event is applied.
     * All children classes will use this apply method to make sure that after
     * applying an event's changes, the event is also recorded on the list of events.
     *  
     * we only apply events if the version of the aggregate (our projection) is increasing
     * in number. In this way, the version number of the aggregate defines the order of events.
     * This is used for concurrency exception and control in our data storage as well. 
     * 
     * @param e the event being applied to the projection
     */
    apply = (e: RegisteredEvent) => {
        if(e.version > this.version){
            this.when(e);
            this.changes.push(e);
        } else {
            throw new Error("event version outdated");
        }
    }

    getChanges = () => {
        return this.changes;
    }

    abstract when(e: RegisteredEvent): void;
}

// add an interface for clonable 
interface ICopy {
   copy(): any 
}

/**
 * TodoList is an aggregate root that represents a To-Do list.
 */
export class TodoList extends IAggregate implements ICopy { 
    id = uuidv4();
    version = -1; // start at -1 since genesis event is event 0
    title = "";
    description: string | undefined;
    due_by: number | undefined;
    tasks: TodoTask[] = [];

    constructor(created_event?: TodoListCreated){
        super();
        if (created_event){ 
            this.init(created_event);
        }
    }

    copy = (): TodoList => {
        const result: TodoList = new TodoList();
        this.changes.forEach(c => result.apply(c))
        return result;
    }

    public when = ( e: RegisteredEvent): void => {
        const handlers = new Map<EventName, any>([
            [EventName.LIST_CREATED, this.init],
            [EventName.TASK_ADDED_TO_LIST, this.addTask],
            [EventName.TASK_COMPLETED, this.markTaskCompleted]
        ]);

        const handler = handlers.get(e.event_name);
        if (handler) {
            handler(e);
            this.version = e.version;
        }
    }

    private init = ( e: TodoListCreated): void => {
        this.id = e.list_id;
        this.title = e.title;
        this.description = e.description;
        this.due_by = e.due_by;
        this.version = 0;
    }

    private addTask = ( e: TaskAddedToList): void => {
        this.tasks.push(new TodoTask(e));
    }

    private markTaskCompleted = (e: TaskCompleted): void => {
        this.tasks
            .filter((task: TodoTask) => task.id === e.task_id )
            .map((task: TodoTask) => task.completed = true);

    }
}

/**
 * TodoTask is an aggregate that represents a task. This is typically 
 * created as part of a todo list object.
 */
export class TodoTask extends IAggregate{
    id = uuidv4();
    version = 0; 
    title = "";
    description: string | undefined;
    due_by: number | undefined;
    priority: Priority = Priority.LOW;
    completed = false;

    constructor(e?: TaskAddedToList){
        super();
        if (e){
            this.init(e);
        }
    }

    public when = (e: RegisteredEvent): void => {
        const handlers = new Map<EventName, any>([ 
            [EventName.TASK_ADDED_TO_LIST, this.init],
        ])

        const handler = handlers.get(e.event_name);
        if (handler) {
            handler(e);
        }
    }

    // populate info on the todo task from
    // the event that creates a todo task
    private init = (e: TaskAddedToList): void => {
        this.id = e.task_id;
        this.completed = false;
        this.due_by = e.due_by;
        this.title = e.title;
        this.priority = e.priority;
    }
}
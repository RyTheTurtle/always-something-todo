import { v4 as uuidv4 } from "uuid";

export enum Priority {
    LOW = "low",
    MED = "med",
    HIGH = "high"
}

export interface ITask {
    id: string | undefined;
    title: string;
    description: string | undefined;
    due_by: number | undefined;
    priority: Priority;
    completed: boolean;
}

export interface ITodoList {
    id: string | undefined;
    title: string;
    description: string | undefined;
    due_by: number | undefined;
    tasks: ITask[];
}

export enum EventName {
    LIST_CREATED = "list_created",
    TASK_ADDED = "task_added",
    TASK_COMPLETED = "task_completed"
}

export type RegisteredEvent = (TodoListCreated
                                | TaskAdded
                                | TaskCompleted );

export interface IProjection {
    onEvent(e: RegisteredEvent): void;
}

export interface DomainEvent {
    event_id: string;
    utc_timestamp: number;
}

export interface TodoListCreated extends DomainEvent {
    event_name: EventName.LIST_CREATED;
    title: string;
    id: string;
    description: string | undefined;
    due_by: number | undefined;
}

export interface TaskAdded extends DomainEvent {
    event_name: EventName.TASK_ADDED;
    list_id: string;
    task_id: string;
    title: string;
    description: string | undefined;
    due_by: number | undefined;
    priority: Priority;
}

export interface TaskCompleted extends DomainEvent {
    event_name: EventName.TASK_COMPLETED;
    list_id: string;
    task_id: string;
}

export class TodoTask implements IProjection, ITask {
    id: string = uuidv4();
    title = "";
    description: string | undefined;
    due_by: number | undefined;
    priority: Priority = Priority.LOW;
    completed = false;

    constructor(created_event?: TaskAdded){
        if (created_event){
            this.init(created_event);
        }
    }

    public onEvent = (e: RegisteredEvent): void => {
        // we only respond to a single event type here
        // so we can just invoke the function directly
        this.init(e as TaskAdded);
    }

    // populate info on the todo task from
    // the event that creates a todo task
    private init = (e: TaskAdded): void => {
        this.id = e.task_id;
        this.completed = false;
        this.due_by = e.due_by;
        this.title = e.title;
        this.priority = e.priority;
    }
}

export class TodoList implements IProjection, ITodoList {
    id: string = uuidv4();
    title = "";
    description: string | undefined;
    due_by: number | undefined;
    tasks: TodoTask[];

    constructor(created_event?: TodoListCreated){
        this.tasks = [];
        if (created_event){ 
            this.init(created_event);
        }
    }

    public onEvent = ( e: RegisteredEvent): void => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handlers = new Map<EventName, any>([
            [EventName.LIST_CREATED, this.init],
            [EventName.TASK_ADDED, this.addTask],
            [EventName.TASK_COMPLETED, this.markTaskCompleted]
        ]);

        const handler = handlers.get(e.event_name);
        if (handler) {
            handler(e);
        }
    }

    private init = ( e: TodoListCreated): void => {
        
        for(const [k,v ] of Object.entries(e)){
            console.log(`${k} : ${v}`)
        }
        this.id = e.id;
        this.title = e.title;
        this.description = e.description;
        this.due_by = e.due_by;
    }

    private addTask = ( e: TaskAdded): void => {
        const task: TodoTask = new TodoTask(e);
        this.tasks.push(task);
    }

    private markTaskCompleted = (e: TaskCompleted): void => {
        this.tasks
            .filter((task: TodoTask) => task.id === e.task_id )
            .map((task: TodoTask) => task.completed = true);

    }
}


export type RegisteredEvent = (TodoListCreated
    | TaskAddedToList
    | TaskCompleted );


export enum EventName {
    LIST_CREATED = "list_created",
    TASK_ADDED_TO_LIST = "task_added_to_list",
    TASK_COMPLETED = "task_completed"
}

interface DomainEvent {
    event_id: string;
    version: number;
    utc_timestamp: number;
}

export interface TodoListCreated extends DomainEvent {
    event_name: EventName.LIST_CREATED;
    title: string;
    list_id: string;
    description: string | undefined;
    due_by: number | undefined;
}

export interface TaskAddedToList extends DomainEvent {
    event_name: EventName.TASK_ADDED_TO_LIST;
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


export enum Priority {
    LOW = "low",
    MED = "med",
    HIGH = "high"
}
export enum Priority {
    LOW, MED, HIGH
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

export module events {

    // create a base event interface that contains 
    // common fields for every event we have. 
    export interface Event {
        utc_timestamp_millis: number;
        event_id: string;
    }

    export interface ListCreatedEvent extends Event {
        title: string,
        description: string | undefined;
        due_by: number | undefined;
    }

    export interface TaskCreatedEvent extends Event {
        list_id: string;
        task_id: string;
        title: string;
        description: string | undefined;
        due_by: number | undefined;
        priority: Priority;
    }

    export interface TaskCompletedEvent extends Event {
        list_id: string; 
        task_id: string;
    }
}
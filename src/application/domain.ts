export enum Priority {
    LOW, MED, HIGH
}

export interface ITask {
    id: string | undefined;
    title: string;
    description: string | undefined;
    due_by: number;
    priority: Priority;
    completed: boolean;
}

export interface ITodoList {
    id: string | undefined;
    title: string;
    description: string | undefined;
    due_by: number;
    tasks: ITask[];
}

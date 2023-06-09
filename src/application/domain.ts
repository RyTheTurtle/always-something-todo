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

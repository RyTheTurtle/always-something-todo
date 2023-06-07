export enum Priority {
    LOW, MED, HIGH
}

export interface ITask {
    id: number | undefined;
    title: string;
    description: string | undefined;
    due_by: number;
    priority: Priority;
}

export interface ITodoList {
    id: number | undefined;
    title: string;
    description: string | undefined;
    due_by: number;
    tasks: ITask[];
}

module Domain { 
    export enum Priority {
        LOW, MED, HIGH
    }

    export interface Task {
        id: number | undefined,
        title: string,
        description: string | undefined,
        due_by: number,
        priority: Priority
    }

    export interface TodoList {
        id: number | undefined,
        title: string,
        description: string | undefined, 
        due_by: number, 
        tasks: Task[]
    }
}
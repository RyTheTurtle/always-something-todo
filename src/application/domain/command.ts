import { Priority } from "./event"

/**
 * RegisteredCommand is used for the type 
 * system to register what commands are valid. 
 * 
 * This also lets us use the registered commands 
 * as a discriminated union for type checking 
 * purposes with Typescript.
 */
export type RegisteredCommand = (
    CreateTodoListCommand|
    AddTaskCommand|
    CompleteTaskCommand
)

export enum COMMAND_NAME {
    CREATE_TODO_LIST = "create_todo_list",
    ADD_TASK = "add_task",
    SET_TASK_COMPLETED = "set_task_completed"
}

export interface CreateTodoListCommand {
    name: COMMAND_NAME.CREATE_TODO_LIST,
    timestamp_utc: number
    details: { 
        title: string,
        description: string | undefined, 
        due_by: number | undefined
    }
}

export interface AddTaskCommand {
    name: COMMAND_NAME.ADD_TASK,
    timestamp_utc: number
    details: { 
        list_id: string,
        title: string,
        description: string | undefined, 
        due_by: number | undefined,
        priority: Priority
    }
}

export interface CompleteTaskCommand { 
    name: COMMAND_NAME.SET_TASK_COMPLETED,
    timestamp_utc: number,
    details: { 
        list_id: string, 
        task_id: string
    }
}
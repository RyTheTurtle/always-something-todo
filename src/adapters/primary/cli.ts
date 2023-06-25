// Implements a CLI based interface for interacting with the TODO application, as
// a simple example,
// Since this is a simple example, robust error handling has been omitted
// for brevity. This is mostly to demonstrate how to create a primary adapter
// that can wire up and use our applicaiton by connecting secondary adapters
// and interacting with the application through it's primary port interface.

import promptSync, { Prompt } from "prompt-sync";
import { TodoFacade } from "../../application/service";
import { ITodoService } from "../../ports/primaryPort"; 
import { InMemoryRepo } from "../secondary/secondary";
import { AddTaskCommand, COMMAND_NAME, CompleteTaskCommand, CreateTodoListCommand } from "../../application/domain/command";
import { Priority } from "../../application/domain/event";

export function cliAdapter() {
    // plug in our dependencies here.
    // since the primary adapter here is responsible for
    // managing the context of our application, we aren't injecting
    // dependencies to this function. Effectively, this would just be
    // our 'main' function.

    const repo = new InMemoryRepo();
    const application: ITodoService = new TodoFacade(repo);
    const prompter = promptSync();

    // maps user input commands to the functions that execute them.
    type PromptCommandHandler =  (a: promptSync.Prompt, b: ITodoService) => void;
    const promptHandlers: Map<string, PromptCommandHandler> = new Map([
        ["1", onCreateTodoListCommand],
        ["2", onAddTaskCommand],
        ["3", onCompleteTaskCommand],
    ]);

    for(;;) {
        const userInput = getMenuSelection(prompter);
        const handler = promptHandlers.get(userInput);
        if (handler){
            handler(prompter, application);
        } else {
            console.log("Invalid command!");
            break;
        }
    }
}

function onCreateTodoListCommand(prompter: promptSync.Prompt, application: ITodoService) {
    const list_title = prompter("What is the Todo List title?: ");
    const command: CreateTodoListCommand = {
        name: COMMAND_NAME.CREATE_TODO_LIST,
        timestamp_utc: (new Date()).getTime(),
        details: {
            title: list_title,
            description: undefined,
            due_by: undefined
        }
    }
    application.createTodoList(command);
    console.log("Created Todo List!");
}

function onAddTaskCommand(prompter: promptSync.Prompt, application: ITodoService) {
    // TODO would make more sense to have them enter a title
    // instead of a list ID, but would need to make that a
    // supported feature in the application layer first.
    const list_id = prompter("What list do you want to update?: ");
    const task_title = prompter("What task do you want to add?: ");
    const task_priority = prompter("What is the priority? (low, med, high)?: ");
    const lu_priority = new Map<string, Priority>(
        [
            ["low",Priority.LOW],
            ["med",Priority.MED],
            ["high", Priority.HIGH]
        ]
    );

    const priority = lu_priority.get(task_priority.toLowerCase()); 
    if(!priority){
        throw new Error("invalid priority");
    }

    const command: AddTaskCommand = {
        name: COMMAND_NAME.ADD_TASK,
        timestamp_utc: (new Date()).getTime(),
        details: {
            list_id: list_id,
            title: task_title,
            description: undefined,
            due_by: undefined,
            priority: priority
        }
    }
    application.addTask(command);
    console.log("Updated list!");
}

function onCompleteTaskCommand(prompter: promptSync.Prompt, application: ITodoService) {
    // TODO would make more sense to have them enter a title
    // instead of a list ID, but would need to make that a
    // supported feature in the application layer first.
    const list_id = prompter("What list should be updated?: ");
    const task_id = prompter("What task is completed?: ");
    const command :CompleteTaskCommand = {
        name: COMMAND_NAME.SET_TASK_COMPLETED,
        timestamp_utc: (new Date()).getTime(),
        details: {
            list_id: list_id,
            task_id: task_id
        }
    }
    application.completeTask(command)
}



function getMenuSelection(p: promptSync.Prompt): string {
    const menu = `
    Always Something Todo! 

    Please select a command number below 

    Commands:
        1. Create a new todo list 
        2. Add a task to a todo list 
        3. Mark a task completed
        4. View a Todo list  
    >
    `;
    return p(menu);
}

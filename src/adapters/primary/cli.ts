// Implements a CLI based interface for interacting with the TODO application, as
// a simple example,
// Since this is a simple example, robust error handling has been omitted
// for brevity. This is mostly to demonstrate how to create a primary adapter
// that can wire up and use our applicaiton by connecting secondary adapters
// and interacting with the application through it's primary port interface.

import promptSync, { Prompt } from "prompt-sync";
import { Priority } from "../../application/domain";
import { TodoFacade } from "../../application/service";
import { ITodoService } from "../../ports/primaryPort";
import { InMemoryRepo } from "../secondary/secondary";
import { todo } from "node:test";

export function cliAdapter() {
    // plug in our dependencies here.
    // since the primary adapter here is responsible for
    // managing the context of our application, we aren't injecting
    // dependencies to this function. Effectively, this would just be
    // our 'main' function.

    let repo = new InMemoryRepo();
    let application: ITodoService = new TodoFacade(repo);
    const prompter = promptSync();

    // maps user input commands to the functions that execute them. 
    type PromptCommandHandler =  (a: promptSync.Prompt, b: ITodoService) => void;
    const promptHandlers: Map<string, PromptCommandHandler> = new Map([
        ["1", onCreateTodoListCommand],
        ["2", onAddTaskCommand],
        ["3", onCompleteTaskCommand]
    ]);

    while (true) {
        let userInput = getMenuSelection(prompter);
        let handler = promptHandlers.get(userInput);
        if(handler){
            handler(prompter, application);
        } else {
            console.log("Invalid command!");
        }
    }
}

function onCreateTodoListCommand(prompter: promptSync.Prompt, application: ITodoService) {
    let listTitle = prompter("What is the Todo List title?: ");
    let newList = application.createTodoList({
        description: undefined,
        due_by: undefined,
        id: undefined,
        tasks: [],
        title: listTitle
    });
    console.log("Created Todo List!");
}

function onAddTaskCommand(prompter: promptSync.Prompt, application: ITodoService) {
    // TODO would make more sense to have them enter a title
    // instead of a list ID, but would need to make that a
    // supported feature in the application layer first.
    let listId = prompter("What list do you want to update?: ");
    let taskTitle = prompter("What task do you want to add?: ");
    let newTask = {
        completed: false,
        description: undefined,
        due_by: undefined,
        id: undefined,
        priority: Priority.LOW,
        title: taskTitle,
    };
    application.addTask(listId, newTask);
    console.log("Updated list!");
}

function onCompleteTaskCommand(prompter: promptSync.Prompt, application: ITodoService) {
    // TODO would make more sense to have them enter a title
    // instead of a list ID, but would need to make that a
    // supported feature in the application layer first.
    let listId = prompter("What list should be updated?: ");
    let taskTitle = prompter("What task is completed?: ");
    let todoList = application.getTodoList(listId);
    let completedTask = todoList?.tasks.filter(t => t.title === taskTitle)[0];
    if(completedTask){
        application.completeTask(completedTask, listId);
        console.log("Task marked complete!");
    } else {
        console.error("Invalid task ID");
    }
}

function getMenuSelection(p: promptSync.Prompt): string {
    const menu: string = `
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

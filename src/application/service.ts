import { InMemoryEventRepo } from "../adapters/secondary/eventRepository";
import {ITodoService} from "../ports/primaryPort";
import { ITodoEventRepository } from "../ports/secondaryPort";
import { EventName, ITask, ITodoList, RegisteredEvent, TaskAdded, TaskCompleted, TodoListCreated } from "./domain";
import { v4 as uuid4 } from "uuid";

export class TodoFacade implements ITodoService {
    private repository: ITodoEventRepository;

    constructor(repo: ITodoEventRepository) {
        this.repository = repo;
    }

    public createTodoList(list: ITodoList): ITodoList | undefined {
        // create a new write event for a todo repository
        const todoCreatedEvent: TodoListCreated = {
            event_name: EventName.LIST_CREATED,
            title: list.title,
            id: uuid4(),
            description: list.description,
            due_by: list.due_by,
            event_id: "",
            utc_timestamp: new Date().getTime()
        }
        this.repository.write(todoCreatedEvent);
        return list;
    }

    public getTodoList(id: string): ITodoList | undefined {
        return this.repository.getTodoList(id);
    }

    public addTask(todoListId: string, task: ITask): ITask | undefined {
        const existingList = this.repository.getTodoList(todoListId);
        if(!existingList){
            throw Error("Invalid To-Do List");
        }
        const newTaskEvent : TaskAdded = {
            event_name: EventName.TASK_ADDED,
            list_id: existingList.id ?? "",
            task_id: uuid4(),
            title: task.title,
            description: task.description,
            due_by: task.due_by,
            priority: task.priority,
            event_id: uuid4(),
            utc_timestamp: new Date().getTime()
        }
        this.repository.write(newTaskEvent);
        return task;
    }

    public completeTask(task: ITask, todoListId: string): void {
        // we need to check if the task is already completed
        // before writing an event 
        const list = this.repository.getTodoList(todoListId);
        const existingTask = list?.tasks.filter((t)=> t.id === task.id 
                                                   && !t.completed);
        if(!existingTask) {
            throw Error("Task is missing or already completed!")
        }
        const completedEvent : TaskCompleted = {
            event_name: EventName.TASK_COMPLETED,
            list_id: todoListId,
            task_id: task.id ?? "",
            event_id: uuid4(),
            utc_timestamp: new Date().getTime()
        }
        this.repository.write(completedEvent)
    }

    // yes this normally wouldn't be public, but we're 
    // sort of "cheating" here just for illustrative 
    // purposes to be able to show the entire event log 
    public getEventLog():RegisteredEvent[] {
        return (this.repository as InMemoryEventRepo).events;
    }
}

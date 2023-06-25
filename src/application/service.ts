import {ITodoService} from "../ports/primaryPort";
import { ITodoRepository } from "../ports/secondaryPort";
import { v4 as uuid4 } from "uuid";
import { CreateTodoListCommand, AddTaskCommand, CompleteTaskCommand } from "./domain/command";
import { TodoList, TodoTask } from "./domain/aggregate";
import { EventName, TaskAddedToList, TaskCompleted, TodoListCreated } from "./domain/event";

export class TodoFacade implements ITodoService {
    private repository: ITodoRepository;

    constructor(repo: ITodoRepository) {
        this.repository = repo;
    }

    createTodoList(c: CreateTodoListCommand): TodoList | undefined {
        const todo_list = new TodoList();
        const list_created_event: TodoListCreated = {
            event_name: EventName.LIST_CREATED,
            title: c.details.title,
            list_id: uuid4(),
            description: c.details.description,
            due_by: c.details.due_by,
            event_id: uuid4(),
            version: 0,
            utc_timestamp: c.timestamp_utc
        }
        todo_list.apply(list_created_event);
        this.repository.save(todo_list);
        return todo_list;
    }

    getTodoList(id: string): TodoList | undefined {
        return this.repository.read(id);
    }

    addTask(c: AddTaskCommand): TodoTask | undefined {
        const todo_list = this.repository.read(c.details.list_id);
        if(!todo_list){
            throw new Error("invalid_list_id");
        }
        const task_added_event: TaskAddedToList = {
            event_name: EventName.TASK_ADDED_TO_LIST,
            list_id: c.details.list_id,
            task_id: uuid4(),
            title: c.details.title,
            description: c.details.description,
            due_by: c.details.due_by,
            priority: c.details.priority,
            event_id: uuid4(),
            version: todo_list.version + 1,
            utc_timestamp: c.timestamp_utc
        }
        todo_list.apply(task_added_event);
        this.repository.save(todo_list);
        return todo_list.tasks
                .filter(t => t.id === task_added_event.task_id)
                .pop()
    }

    completeTask(c: CompleteTaskCommand): void {
        const todo_list = this.repository.read(c.details.list_id);
        if(!todo_list){
            throw new Error("invalid_list_id");
        }

        const completed_event : TaskCompleted = {
            event_name: EventName.TASK_COMPLETED,
            list_id: c.details.list_id,
            task_id: c.details.task_id,
            event_id: uuid4(),
            version: todo_list?.version + 1,
            utc_timestamp: c.timestamp_utc
        }

        todo_list.apply(completed_event);
        this.repository.save(todo_list);
    }
}

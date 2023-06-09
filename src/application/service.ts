import {ITodoService} from "../ports/primaryPort";
import { ITodoRepository } from "../ports/secondaryPort";
import { ITask, ITodoList } from "./domain";

export class TodoFacade implements ITodoService {
    private repository: ITodoRepository;

    constructor(repo: ITodoRepository) {
        this.repository = repo;
    }

    public createTodoList(list: ITodoList): ITodoList | undefined {
        return this.repository.create(list);
    }

    public getTodoList(id: string): ITodoList | undefined {
        return this.repository.read(id);
    }

    public addTask(todoListId: string, task: ITask): ITask | undefined {
        let list = this._getList(todoListId);
        list.tasks.push(task);
        this.repository.update(list);
        return task;
    }

    public completeTask(task: ITask, todoListId: string): void {
        let list = this._getList(todoListId);
        list.tasks.map((v, i) => {
            if (v.id === task.id) {
                v.completed = true;
            }
        });
        this.repository.update(list);
    }

    private _getList(id: string): ITodoList {
        let list = this.repository.read(id);

        if (!list) {
            throw Error("invalid todo list Id");
        }
        return list;
    }

}

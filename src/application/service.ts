import {ITodoService} from "../ports/primaryPort";
import { ITodoRepository } from "../ports/secondaryPort";
import { ITask, ITodoList } from "./domain";

class TodoFacade implements ITodoService {
    private repository: ITodoRepository;

    constructor(repo: ITodoRepository) {
        this.repository = repo;
    }

    public createTodoList(list: ITodoList): ITodoList | undefined {
        return this.repository.create(list);
    }

    public getTodoList(id: number): ITodoList | undefined {
        return this.repository.read(id);
    }

    public addTask(todoListId: number, task: ITask): ITask | undefined {
        let list = this._getList(todoListId);
        list.tasks.push(task);
        this.repository.update(list);
        return task;
    }

    public completeTask(task: ITask, todoListId: number): void {
        let list = this._getList(todoListId);
        list.tasks.map((v, i) => {
            if (v.id === task.id) {
                // TODO IMPLEMENT A STATUS FIELD ON TASK INTERFACE
                // and update it here
            }
        });
        this.repository.update(list);
    }

    private _getList(id: number): ITodoList {
        let list = this.repository.read(id);

        if (!list) {
            throw Error("invalid todo list Id");
        }
        return list;
    }

}

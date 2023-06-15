import { Application, Request, Response } from 'express';
import express from 'express';
import { InMemoryEventRepo } from '../secondary/eventRepository';
import { TodoFacade } from '../../application/service';
import { ITodoService } from '../../ports/primaryPort';
import { ITask, ITodoList } from '../../application/domain';

export function server(port: number){
    const app : Application = express();
    // configure middleware 
    app.use(express.json());

    // configure our service facade from the application 
    // and attach it to 'app' so we can refer to it in 
    // our handler functions. 
    const repository = new InMemoryEventRepo();
    const serviceFacade = new TodoFacade(repository);
    app.set("facade",serviceFacade);
    // register routes
    app.get('/todolist/:id', getTodoList);
    app.put('/todolist', createTodoList); 
    app.put('/todolist/:id/task', addTodoListTask);
    app.post('/todolist/:id/task/:task_id/complete', completeTask); 
    app.listen(port, ()=> { 
        console.log(`server is running on port ${port}`)
    })
}

// here we define our handler functions. We could, if we had a lot of these,
// define these handlers in different files. Since we don't have much going 
// on here, we'll just put the handler functions in this file 
function getTodoList(req: Request, resp: Response) : void {
    const facade: ITodoService = req.app.get("facade");
    resp.contentType("application/json");
    try{
        const list_id = req.params.id;
        const todoList = facade.getTodoList(list_id);
        if(todoList){ 
            resp.send(JSON.stringify(todoList)) 
        } else {
            resp.status(404).send();
        }
    } catch(e) { 
        onError(resp, e);
    }
    
}  

function createTodoList(req: Request, resp: Response): void {
    const facade: ITodoService = req.app.get("facade");
    resp.status(201).contentType("application/json");
    try {
        // TODO add some schema validation here 
        const result = facade.createTodoList(req.body);
        resp.send(JSON.stringify(result));
    } catch(e) {
        onError(resp, e);
    }
}

function addTodoListTask(req: Request, resp: Response): void {
    const facade: ITodoService = req.app.get("facade");
    resp.status(201).contentType("application/json");
    try {
        // TODO add some schema validation here 
        facade.addTask(req.params.id, req.body);
        const updatedList = facade.getTodoList(req.params.id);
        resp.send(JSON.stringify(updatedList));
    } catch(e) {
        onError(resp, e);
    }
}

function completeTask(req: Request, resp: Response): void {
    const facade: ITodoService = req.app.get("facade");
    resp.status(201).contentType("application/json");
    try {
        // TODO add some schema validation here 
        const list = facade.getTodoList(req.params.id);
        if(!list){ 
            throw Error("invalid todo list");
        }

        const task: unknown = list.tasks
            .filter((t)=> t.id === req.params.list_id || t.title === req.params.list_id)
            .reduce((_, nextTask) => nextTask, {});

        if(!task) { 
            throw Error("invalid task id");
        }
        facade.completeTask(req.params.list_id, task as ITask);
        const updatedList = facade.getTodoList(req.params.id);
        resp.send(JSON.stringify(updatedList));
    } catch(e) {
        onError(resp, e);
    }
}

function onError(resp: Response<any, Record<string, any>>, e: unknown) {
    resp.status(500);
    if (e instanceof Error) {
        resp.send(e.message);
    } else {
        resp.send("Failed");
    }
}

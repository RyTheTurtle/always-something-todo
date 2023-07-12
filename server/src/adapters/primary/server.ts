import { Application, Request, Response } from 'express';
import express from 'express';
import { TodoFacade } from '../../application/service';
import { ITodoService } from '../../ports/primaryPort'; 
import { COMMAND_NAME } from '../../application/domain/command';
import { Priority } from '../../application/domain/event';
import { AwsEventRepository } from '../secondary/eventRepository';
import { SQSClient } from '@aws-sdk/client-sqs';

export async function server(port: number){
 
    const app : Application = express(); 

    // configure middleware 
    app.use(express.json());

    // configure our service facade from the application 
    // and attach it to 'app' so we can refer to it in 
    // our handler functions. 
    const DEFAULT_DELAY = 1;
    const repository = new AwsEventRepository(new SQSClient({region: process.env.AWS_REGION}), undefined, DEFAULT_DELAY); 

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

async function createTodoList(req: Request, resp: Response): Promise<void> {
    const facade: ITodoService = req.app.get("facade");
    resp.status(201).contentType("application/json");
    console.log(req.body)
    try {
        // TODO add some schema validation here 
        const result = facade.createTodoList({
            name: COMMAND_NAME.CREATE_TODO_LIST,
            timestamp_utc: (new Date()).getTime(),
            details: {
                title: req.body.title,
                description: req.body.description,
                due_by: req.body.due_by
            }
        });
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
        const updatedList = facade.addTask({
            name: COMMAND_NAME.ADD_TASK,
            timestamp_utc: (new Date()).getTime(),
            details: {
                list_id: req.params.id,
                title: req.body.title,
                description: req.body.description,
                due_by: req.body.due_by,
                priority: req.body.priority ?? Priority.LOW
            }
        })
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
        const updatedList = facade.completeTask({
            name: COMMAND_NAME.SET_TASK_COMPLETED,
            timestamp_utc: (new Date()).getTime(),
            details: {
                list_id: req.params.id,
                task_id: req.params.task_id
            }
        });
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

# always-something-todo
A learning application to showcase the ports and adapters 
architecture. This project implements a To-Do application 
in an iterative manner, starting with a simple CLI app 
with no authentication or persistence, eventually evolving 
to a highly scalable, cloud based web application. 

## Prerequisites 
- aws SDK 
- NodeJS v19.x.x + 

## running the application (for now)
Currently, this application can be ran from the command line using 
the commands 

```
export AWS_PROFILE=<your aws profile>
aws sso login --profile=<your aws profile> 

npm install && npm start <port>
```

This will start up the application on the specified port, which can then be accessed via browser or API testing tool like Postman. 

### APIs available (so far)

- `GET /todolist/:id`, load a To-Do list by id or name
- `PUT /todolist`, create a new To-Do list
- `PUT /todolist/:id/task`, create a new task and assign it to the todo list 
- `POST /todolist/:id/task/:task_id/complete`, mark a task on a to-do list as completed.  


import { EventName, ITodoList, RegisteredEvent, TodoList, TodoListCreated } from "../../application/domain";
import { ITodoEventRepository } from "../../ports/secondaryPort";
import { GetQueueUrlCommand,
         SendMessageCommand,
         SQSClient } from "@aws-sdk/client-sqs"
 

// A simple in memory repository for persisting events and
// fetching todo lists from those events.

export class InMemoryEventRepo implements ITodoEventRepository {
    events: RegisteredEvent[];

    constructor() {
        this.events = [];
    }

    write(e: RegisteredEvent): void {
        this.events.push(e);
    }

    /**
     * Returns the current state of the ToDo list
     * requested by rehydrating the Todo list by
     * reading all of the events and applying the appropriate
     * transformations on the todo list object.
     *
     * @param id the name or ID of the todo list to load
     */
    public getTodoList(key: string): TodoList | undefined {
        let result: TodoList | undefined = undefined;
        this.events.map((e) => {
            // our first event for the event id that we're looking for should be
            // the first event for LIST_CREATED that has the name or ID matching
            // the key
            const eventMatchesKey = (e: RegisteredEvent) => {
                return ((e as TodoListCreated).title === key
                         || (e as TodoListCreated).id === key)
            }

            const isCreationEvent = (
                !result
                && e.event_name == EventName.LIST_CREATED
                && eventMatchesKey(e)
            );

            if (isCreationEvent){
                result = new TodoList((e as TodoListCreated));
            } else if(result) {
                result.onEvent(e);
            }
        });
        return result;
    }
}

/**
 * AwsEventRepository implements a ITodoEventRepository that is connected to
 * Amazon SQS for publishing events to a queue. 
 */
export class AwsEventRepository implements ITodoEventRepository {
    private sqsClient: SQSClient;
    //FIXME DON'T HARDCODE THE QUEUE NAME, CONFIGURE IT INSTEAD
    private SQS_QUEUE_NAME = 'TodoEventQueue';
    private SQS_QUEUE_URL: string | undefined; 

    constructor(client:SQSClient){
        // passing in a empty configuration struct will load credentials 
        // and session from local aws cli config file.
        this.sqsClient = client; 
    }   

    write = async (e: RegisteredEvent) => {
        await this.getSqsUrl();
        const command = new SendMessageCommand({
            QueueUrl: this.SQS_QUEUE_URL,
            DelaySeconds: 10,
            MessageBody: JSON.stringify(e),
          });
        const result = await this.sqsClient.send(command);
        console.log(JSON.stringify(result))
    }

    /**
     * This function will make sure the SQS_QUEUE_URL is properly loaded. If
     * the url has already been initialized on this object, it does nothing.
     * 
     * @returns string that is the same value as the SQS_QUEUE_URL on the object
     */
    getSqsUrl = async () : Promise<string | undefined> => {
        if(!this.SQS_QUEUE_URL){ 
            const command = new GetQueueUrlCommand({ QueueName: this.SQS_QUEUE_NAME });
            const response = await this.sqsClient.send(command);
            this.SQS_QUEUE_URL = response.QueueUrl;
            
        }
        return this.SQS_QUEUE_URL;
    }
    
    getTodoList(id: string): ITodoList | undefined {
        throw new Error("Method not implemented.");
    } 

}
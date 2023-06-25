import { GetQueueUrlCommand,
         SendMessageCommand,
         SQSClient } from "@aws-sdk/client-sqs"
import { ITodoRepository } from "../../ports/secondaryPort";
import { RegisteredEvent } from "../../application/domain/event";
import { TodoList } from "../../application/domain/aggregate";
 
/**
 * AwsEventRepository implements a ITodoEventRepository that is connected to
 * Amazon SQS for publishing events to a queue. 
 */
export class AwsEventRepository implements ITodoRepository {
    private sqsClient: SQSClient;
    //FIXME DON'T HARDCODE THE QUEUE NAME, CONFIGURE IT INSTEAD
    private SQS_QUEUE_NAME = 'TodoEventQueue';
    private SQS_QUEUE_URL: string | undefined; 

    constructor(client:SQSClient){
        // passing in a empty configuration struct will load credentials 
        // and session from local aws cli config file.
        this.sqsClient = client; 
    }   

    read(list_id: string): TodoList | undefined {
        // FIXME read events or projection from a database  
        throw new Error("Method not implemented.");
    }

    save(list: TodoList): undefined {
        // FIXME publish new events without publishing old events to sqs 
        throw new Error("Method not implemented.");
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
    
    getTodoList(id: string): TodoList | undefined {
        throw new Error("Method not implemented.");
    } 

}
import { GetQueueUrlCommand,
         ListQueuesCommand,
         paginateListQueues,
         SendMessageBatchCommand,
         SendMessageCommand,
         SQSClient } from "@aws-sdk/client-sqs"
import { ITodoRepository } from "../../ports/secondaryPort";
import { RegisteredEvent } from "../../application/domain/event";
import { TodoList } from "../../application/domain/aggregate";
import {v4 as uuidv4} from "uuid"; 
 
/**
 * AwsEventRepository implements a ITodoEventRepository that is connected to
 * Amazon SQS for publishing events to a queue. 
 * 
 * For now, we will combine an in-memory persistence of the To-Do state 
 * and events and publish new messages to SQS. Eventually, worker processes
 * on the other end of the SQS queue will consume the messages to update 
 * state in a cloud based database like DDB.
 */
export class AwsEventRepository implements ITodoRepository {
    private sqsClient: SQSClient;
    private SQS_QUEUE_URL: string;
    private SQS_DELAY_SECONDS: number;
    private data: Map<string, TodoList>;

    constructor(client:SQSClient, queue_url?:string | undefined, queue_delay_seconds?:number | undefined){
        // passing in a empty configuration struct will load credentials 
        // and session from local aws cli config file.
        this.sqsClient = client; 
        this.SQS_QUEUE_URL = queue_url ?? process.env.QUEUE_URL!;
        this.SQS_DELAY_SECONDS = queue_delay_seconds ?? Number(process.env.QUEUE_DELAY_SECONDS!);
        console.log(`url: ${this.SQS_QUEUE_URL} \nDelay: ${this.SQS_DELAY_SECONDS}`)
        this.data = new Map<string,TodoList>();
    }   

    read(list_id: string): TodoList | undefined {
        return this.data.get(list_id)?.copy() 
    } 

    /**
     * Save the todo list in the in-memory repository, publishing 
     * any new events to the event queue (amazon SQS). 
     *  
     * @param list 
     * @returns 
     */
    save = async (list: TodoList): Promise<undefined> => {
        console.log(`SQS Queue URL: ${this.SQS_QUEUE_URL}`) 
        let new_list_events = list.getChanges()

        if(this.data.has(list.id)){
            const oldList = this.read(list.id)
            const oldListVersion = (oldList?.version ?? -1)
            const listIsOutdated = oldListVersion >= list.version
            if(listIsOutdated){
                throw Error("concurrency exception") 
            }
            new_list_events = list.getChanges().filter(c => c.version > oldListVersion)
        } 
         
        new_list_events.forEach(async e => this.write(e))
        // for simplicity of lookups, also key it by title.
        this.data.set(list.title, list);
        this.data.set(list.id, list);
        return undefined;
    }

    write = async (e: RegisteredEvent) => {
       
        const command = new SendMessageCommand({
            QueueUrl: this.SQS_QUEUE_URL, 
            MessageBody: JSON.stringify(e),
            MessageGroupId: uuidv4(),
            MessageDeduplicationId: uuidv4()
          });
        const result = await this.sqsClient.send(command);
        console.log(JSON.stringify(result))
    } 
}
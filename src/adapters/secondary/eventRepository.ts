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

// use this class to encapsulate batching items. Primarily, 
// use this to create batches of messages for SQS in a clean 
// way 
class SqsMessageBatcher { 
    batches: any[][];
    max: number;

    constructor(max?: number){
        this.batches = [];
        this.batches.push([]);
        this.max = max ?? 10;
    }

    add(item: any) { 
        const is_current_batch_full = this.batches[this.batches.length - 1].length >= this.max;
        if(is_current_batch_full){
            // need to start a new batch, this one is full 
            this.batches.push([]);
        }
        const latest_batch = this.batches[this.batches.length - 1]
        latest_batch.push(item);
    }
}
 
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
    //FIXME DON'T HARDCODE THE QUEUE NAME, CONFIGURE IT INSTEAD
    private SQS_QUEUE_NAME = 'devo_TodoEventQueue';
    private SQS_QUEUE_URL: string | undefined;
    private data: Map<string, TodoList>;


    constructor(client:SQSClient){
        // passing in a empty configuration struct will load credentials 
        // and session from local aws cli config file.
        this.sqsClient = client; 
        this.data = new Map<string,TodoList>();
    }   

    read(list_id: string): TodoList | undefined {
        return this.data.get(list_id)?.copy() 
    }

    private _message_accumulator_fn = (acc: SqsMessageBatcher, e: RegisteredEvent, ) => {
        acc.add(e)
        return acc
    }

    private _to_sqs_message = (batch: RegisteredEvent[]) => {
        const entries = batch.map(entry => {
            return {Id: entry.event_id, 
                    MessageGroupId: uuidv4(),
                    MessageDeduplicationId: uuidv4(),
                    MessageBody: JSON.stringify(entry)}
        });
        return {
            QueueUrl: this.SQS_QUEUE_URL,
            Entries: entries
        }
    }

    /**
     * Save the todo list in the in-memory repository, publishing 
     * any new events to the event queue (amazon SQS). 
     *  
     * @param list 
     * @returns 
     */
    save = async (list: TodoList): Promise<undefined> => {
        await this.getSqsUrl();
        console.log(`SQS Queue URL: ${this.SQS_QUEUE_URL}`)
        const message_batches = new SqsMessageBatcher()
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
        // TODO why isn't batching working?????
        // new_list_events
        //     .reduce<SqsMessageBatcher>(this._message_accumulator_fn, message_batches)
        //     .batches.map(this._to_sqs_message)
        //     .forEach(async b => {
        //         // FIXME don't block 
        //         await this.sqsClient.send(new SendMessageBatchCommand(b))
        //         console.log(`Sent batch message to SQS \n${JSON.stringify(b)}`)
        //     })
        
        // for now, just do single message sending 
        new_list_events.forEach(async e => this.write(e))
        // for simplicity of lookups, also key it by title.
        this.data.set(list.title, list);
        this.data.set(list.id, list);
        return undefined;
    }

    write = async (e: RegisteredEvent) => {
       
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
        const client = this.sqsClient;
        const pageUrlsResp = paginateListQueues({client}, {})
        for await (const page of pageUrlsResp){
            const nextUrls = page.QueueUrls ?? []
            nextUrls.forEach((url) => console.log(url))
        }
        if(!this.SQS_QUEUE_URL){ 
            const command = new GetQueueUrlCommand({ QueueName: this.SQS_QUEUE_NAME });
            const response = await this.sqsClient.send(command);
            this.SQS_QUEUE_URL = response.QueueUrl;
            
        }
        return this.SQS_QUEUE_URL;
    }
}
"""
Event Worker that reads and processes messages for the todo application 
from an SQS queue

this model uses a pull model to periodically check SQS for a new message.

for examples, see https://boto3.amazonaws.com/v1/documentation/api/latest/guide/sqs-example-sending-receiving-msgs.html 
"""
import boto3 
import os 
import json
from pprint import pprint 
from time import time_ns
from dataclasses import dataclass

@dataclass
class QueueConfig():
    url:str
    wait_timeout:int
    visibility_timeout:int
    attribute_names: list
    message_attribute_names: list
    max_messages: int

@dataclass
class AppContext():
    queue_config: QueueConfig
    sqs_client: dict


def process_messages(ctx:AppContext, messages):
    if messages is not None:
        for message in messages:
            print(f"Found new message from queue")
            pprint(message)
            print(f"Deleting message from queue")
            ctx.sqs_client.delete_message(
                QueueUrl=ctx.queue_config.url,
                ReceiptHandle=message["ReceiptHandle"]
            )
    else:
        print("No messages to process")

def get_message(ctx: AppContext):
    resp = ctx.sqs_client.receive_message(
        QueueUrl= ctx.queue_config.url,
        AttributeNames=ctx.queue_config.attribute_names,
        MaxNumberOfMessages=ctx.queue_config.max_messages,
        MessageAttributeNames= ctx.queue_config.message_attribute_names,
        VisibilityTimeout=ctx.queue_config.visibility_timeout,
        WaitTimeSeconds=ctx.queue_config.wait_timeout
    )
    
    process_messages(ctx, resp.get("Messages"))
        

if __name__ == '__main__':
    print("To-Do event worker")

    sqs_client = boto3.client("sqs")
    queue_cfg = QueueConfig(
        url = os.environ["QUEUE_URL"],
        wait_timeout = int(os.environ["QUEUE_WAIT_TIMEOUT"]),
        visibility_timeout = int(os.environ["QUEUE_VISIBILITY_TIMEOUT"]),
        max_messages = int(os.environ["QUEUE_RECV_MAX_MESSAGES"]),
        attribute_names=[
            "SentTimestamp"
        ],
        message_attribute_names=["All"]
    )
    app_ctx = AppContext(queue_config=queue_cfg, sqs_client=sqs_client)

    while True: 
        get_message(app_ctx)


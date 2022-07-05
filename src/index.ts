import { SQSClient, CreateQueueCommand, SendMessageCommand, GetQueueUrlCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from 'uuid';

const testQueueName = 'test.fifo';

const sqsClient = new SQSClient({
    region: 'ap-east-1',
    /*
    credentials: {
        accessKeyId: '',
        secretAccessKey: '',
    }
    */
});

async function main() {
    try {
        let queueUrl: string | undefined;
        try {
            const getRes = await sqsClient.send(new GetQueueUrlCommand({
                QueueName: testQueueName
            }));
            queueUrl = getRes.QueueUrl;
        } catch {
            if (queueUrl == null) {
                const createRes = await sqsClient.send(new CreateQueueCommand({
                    QueueName: testQueueName,
                    Attributes: {
                        'MessageRetentionPeriod': `${60 * 60 * 24 * 8}`,
                        'FifoQueue': 'true',
                    },
                }));

                queueUrl = createRes.QueueUrl;
            }
        }

        const sendRes = await sqsClient.send(new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({hello: 'world!'}),
            MessageGroupId: '0',
            MessageDeduplicationId: uuidv4(),
        }));

        const recRes = await sqsClient.send(new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 1,
        }));

        if (recRes.Messages) {
            console.log(recRes.Messages[0].Body);

            const delRes = await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: recRes.Messages[0].ReceiptHandle,
            }));
        }
    } catch (error) {
        console.log(error);
    }
}

main();

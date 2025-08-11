import {
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const MATERIALIZED_TABLE = process.env.MATERIALIZED_TABLE!;

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  const writes = event.Records
    .filter(
      (r) =>
        r.eventName === 'INSERT' &&
        r.dynamodb?.NewImage?.eventType?.S === 'habit_checkin'
    )
    .map(async (r) => {
      const newImg = r.dynamodb!.NewImage!;
      const userId = newImg.userId.S!;
      const ts = newImg.sk.S!.replace('ts#', '');
      const day = ts.slice(0, 10);
      const sk = `day#${day}`;

      const existing = await ddb.send(
        new GetCommand({
          TableName: MATERIALIZED_TABLE,
          Key: { userId, sk },
        })
      );

      if (!existing.Item) {
        await ddb.send(
          new UpdateCommand({
            TableName: MATERIALIZED_TABLE,
            Key: { userId, sk },
            UpdateExpression: 'SET #s = if_not_exists(#s, :zero)',
            ExpressionAttributeNames: { '#s': 'summary' },
            ExpressionAttributeValues: {
              ':zero': {
                habitsDue: 0,
                tasksDue: 0,
                checkinsToday: 0,
                streaks: {},
              },
            },
          })
        );
      }

      await ddb.send(
        new UpdateCommand({
          TableName: MATERIALIZED_TABLE,
          Key: { userId, sk },
          UpdateExpression: 'SET #s.#c = if_not_exists(#s.#c, :z) + :one',
          ExpressionAttributeNames: { '#s': 'summary', '#c': 'checkinsToday' },
          ExpressionAttributeValues: { ':z': 0, ':one': 1 },
        })
      );
    });

  await Promise.all(writes);
};

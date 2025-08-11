import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const sub = (event.requestContext as typeof event.requestContext & {
    authorizer?: { jwt?: { claims?: { sub?: string } } }
  }).authorizer?.jwt?.claims?.sub as string | undefined;
  if (!sub) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const habitId = event.pathParameters?.id;
  if (!habitId) {
    return { statusCode: 400, body: 'Missing habit id' };
  }

  const nowIso = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: EVENTS_TABLE,
      Item: {
        userId: sub,
        sk: `ts#${nowIso}`,
        eventType: 'habit_checkin',
        habitId,
        ts: nowIso,
      },
      ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(sk)',
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify({ ok: true, habitId, ts: nowIso }),
    headers: { 'content-type': 'application/json' },
  };
};

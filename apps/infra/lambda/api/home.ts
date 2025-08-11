import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const MATERIALIZED_TABLE = process.env.MATERIALIZED_TABLE!;

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const sub = (event.requestContext as typeof event.requestContext & {
    authorizer?: { jwt?: { claims?: { sub?: string } } }
  }).authorizer?.jwt?.claims?.sub as string | undefined;
  if (!sub) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const day =
    (event.queryStringParameters?.day as string | undefined) ??
    new Date().toISOString().slice(0, 10);
  const sk = `day#${day}`;

  const res = await ddb.send(
    new QueryCommand({
      TableName: MATERIALIZED_TABLE,
      KeyConditionExpression: 'userId = :u AND sk = :sk',
      ExpressionAttributeValues: { ':u': sub, ':sk': sk },
      Limit: 1,
    })
  );

  const item =
    res.Items?.[0] ?? {
      userId: sub,
      sk,
      summary: { habitsDue: 0, checkinsToday: 0, tasksDue: 0, streaks: {} },
    };

  return {
    statusCode: 200,
    body: JSON.stringify({ day, summary: item.summary ?? {} }),
    headers: { 'content-type': 'application/json' },
  };
};

import { Duration, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';

export class DataStack extends Stack {
  public readonly tables: { events: Table; materialized: Table };

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const events = new Table(this, 'EventsTable', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const materialized = new Table(this, 'MaterializedTable', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Streams materializer Lambda
    const materializerFn = new NodejsFunction(this, 'MaterializerFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '..', 'lambda', 'streams', 'materializer.ts'),
      handler: 'handler',
      timeout: Duration.seconds(30),
      environment: {
        MATERIALIZED_TABLE: materialized.tableName,
      },
    });
    materialized.grantReadWriteData(materializerFn);

    materializerFn.addEventSource(
      new DynamoEventSource(events, {
        startingPosition: StartingPosition.LATEST,
        batchSize: 50,
        retryAttempts: 2,
      })
    );

    this.tables = { events, materialized };
  }
}

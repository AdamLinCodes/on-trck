import { Duration, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, HttpMethod, CorsHttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { HttpJwtAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';

import * as path from 'path';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

interface ApiStackProps extends StackProps {
  userPool: IUserPool;
  userPoolClientId: string;
  tables: { events: Table; materialized: Table };
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, tables } = props;

    const healthFn = new NodejsFunction(this, 'HealthFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '..', 'lambda', 'api', 'health.ts'),
      handler: 'handler',
      timeout: Duration.seconds(5),
    });

    const homeFn = new NodejsFunction(this, 'HomeFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '..', 'lambda', 'api', 'home.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      environment: {
        MATERIALIZED_TABLE: tables.materialized.tableName,
      },
    });
    tables.materialized.grantReadData(homeFn);

    const checkinFn = new NodejsFunction(this, 'CheckinFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '..', 'lambda', 'api', 'checkin.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      environment: {
        EVENTS_TABLE: tables.events.tableName,
      },
    });
    tables.events.grantReadWriteData(checkinFn);

    const api = new HttpApi(this, 'Api', {
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowOrigins: [
          'http://localhost:19006',    // Expo web
          'http://localhost:8081',     // Metro dev server (if you host a web page)
          'http://localhost:3000',     // Vite/Next dev (optional)
          'http://127.0.0.1:19006',    // loopback variant (optional)
        ],
        // If you plan to send cookies with fetch(), set this to true
        // allowCredentials: true,
        maxAge: Duration.days(10),
      },
    });

    // Correct alpha authorizer ctor: (id, issuer, { audience })
    const authorizer = new HttpJwtAuthorizer(
      'JwtAuth',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      { jwtAudience: [props.userPoolClientId] }
    );

    api.addRoutes({
      path: '/health',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthInt', healthFn),
    });

    api.addRoutes({
      path: '/home',
      methods: [HttpMethod.GET],
      authorizer,
      integration: new HttpLambdaIntegration('HomeInt', homeFn),
    });

    api.addRoutes({
      path: '/habits/{id}/checkins',
      methods: [HttpMethod.POST],
      authorizer,
      integration: new HttpLambdaIntegration('CheckinInt', checkinFn),
    });

    new CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}

#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { ApiStack } from '../lib/api-stack';

const app = new App();

const auth = new AuthStack(app, 'OnTrck-Auth');
const data = new DataStack(app, 'OnTrck-Data');

new ApiStack(app, 'OnTrck-Api', {
  userPool: auth.userPool,
  userPoolClientId: auth.userPoolClient.userPoolClientId,
  tables: data.tables,
});
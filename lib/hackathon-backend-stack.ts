import {
  Stack,
  StackProps,
  aws_dynamodb,
  aws_lambda,
  aws_apigateway,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class HackathonBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const region = 'ap-southeast-2';

    console.log('...creating dynamodb');

    // dynamodb
    const userTable = new aws_dynamodb.Table(this, 'userDB', {
      partitionKey: {
        name: 'userId',
        type: aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    console.log('...creating lambda functions');

    // user lambda functions
    const getUser = new aws_lambda.Function(this, 'getUser', {
      code: new aws_lambda.AssetCode(path.join(__dirname, '/../src/user')),
      handler: 'getUser.handler',
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      environment: {
        TABLE_NAME: userTable.tableName,
        PRIMARY_KEY: 'userId',
        REGION: region,
      },
    });

    const createUser = new aws_lambda.Function(this, 'createUser', {
      code: new aws_lambda.AssetCode(path.join(__dirname, '/../src/user')),
      handler: 'createUser.handler',
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      environment: {
        TABLE_NAME: userTable.tableName,
        PRIMARY_KEY: 'userId',
        REGION: region,
      },
    });

    const updateUser = new aws_lambda.Function(this, 'updateUser', {
      code: new aws_lambda.AssetCode(path.join(__dirname, '/../src/user')),
      handler: 'updateUser.handler',
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      environment: {
        TABLE_NAME: userTable.tableName,
        PRIMARY_KEY: 'userId',
        REGION: region,
      },
    });

    // dynamodb permissions
    userTable.grantReadData(getUser);
    userTable.grantReadWriteData(createUser);
    userTable.grantReadWriteData(updateUser);

    console.log('...creating api gateway');
    // api gateway
    const api = new aws_apigateway.RestApi(this, 'hackathon-backend', {
      restApiName: 'api for hackathon backend',
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Target',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
      },
    });

    const plan = api.addUsagePlan('basicPlan', {
      name: 'basic',
      throttle: {
        rateLimit: 20,
        burstLimit: 2,
      },
    });

    const apiKey = api.addApiKey('hackathonApiKey');
    plan.addApiKey(apiKey);

    // user handlers
    const getUserHandler = new aws_apigateway.LambdaIntegration(getUser);
    const createUserHandler = new aws_apigateway.LambdaIntegration(createUser);
    const updateUserHandler = new aws_apigateway.LambdaIntegration(updateUser);

    const userApi = api.root.addResource('user');

    // configure endpoints
    userApi.addMethod('GET', getUserHandler);
    userApi.addMethod('PUT', updateUserHandler);
    userApi.addMethod('POST', createUserHandler);
  }
}

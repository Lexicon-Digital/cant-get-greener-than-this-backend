import * as AWS from 'aws-sdk';
import { safeJsonParse } from './utils';
import { APIGatewayProxyHandler } from 'aws-lambda';

AWS.config.update({ region: process.env.REGION as string });
const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;

const db = new AWS.DynamoDB.DocumentClient();

type TExpression = {
  name: string;
  value: string;
};

const expressions: TExpression[] = [
  {
    name: 'weeklyAverageDistance',
    value: ':w',
  },
  {
    name: 'distanceTravelled',
    value: ':x',
  },
  {
    name: 'totalAmountPaid',
    value: ':y',
  },
  {
    name: 'totalContribution',
    value: ':z',
  },
];

const createUpdateExpression = (
  obj: Record<string, any>,
  exps: TExpression[] = expressions,
) => {
  const mappedExps = exps.reduce((accum, current) => {
    if (current.name in obj) {
      return `${accum} ${current.name} = ${current.value},`;
    }
    return accum;
  }, '');
  return `set ${mappedExps}`.replace(/,\s*$/, '');
};

const createExpressionAttributeValues = (
  obj: Record<string, any>,
  exps: TExpression[] = expressions,
) =>
  exps.reduce((accum, current) => {
    if (current.name in obj) {
      accum[current.value] = obj[current.name];
    }
    return accum;
  }, {} as Record<string, unknown>);

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.queryStringParameters?.[PRIMARY_KEY];
  const [err, parsed] = safeJsonParse(event.body!);
  if (err || !id)
    return {
      statusCode: 422,
      body: JSON.stringify({ message: 'invalid payload received' }),
    };

  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: id,
    },
    UpdateExpression: createUpdateExpression(parsed!),
    ExpressionAttributeValues: createExpressionAttributeValues(parsed!),
    ReturnValues: 'ALL_NEW',
  };

  try {
    const res = await db.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};

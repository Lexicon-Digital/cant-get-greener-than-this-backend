import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { safeJsonParse } from './utils';

AWS.config.update({ region: process.env.REGION as string });
const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;

const db = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const [err, parsed] = safeJsonParse(event.body);
  if (err)
    return {
      statusCode: 422,
      body: JSON.stringify({ message: 'invalid payload received' }),
    };

  const id = parsed?.[PRIMARY_KEY];

  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: id,
    },
  };

  const putParams = {
    TableName: TABLE_NAME,
    Item: parsed!,
  };

  try {
    const res = await db.get(getParams).promise();
    if (res.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'userId already exist' }),
      };
    }

    await db.put(putParams).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'user successfully created' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};

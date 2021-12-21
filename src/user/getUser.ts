import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

AWS.config.update({ region: process.env.REGION as string });
const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;

const db = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.queryStringParameters?.[PRIMARY_KEY];

  if (!id)
    return {
      statusCode: 422,
      body: JSON.stringify({ message: 'invalid payload received' }),
    };

  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: id,
    },
  };

  try {
    const res = await db.get(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(res.Item),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};

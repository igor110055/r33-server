import dotenv from 'dotenv';
import { Handler } from '@netlify/functions';

dotenv.config();
// console.info(process.env.TEST_VALUE);

const headers = {
  'Access-Control-Allow-Origin': 'test.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
};

const handler: Handler = async (event, context) => {
  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello World with CORS!',
      event: JSON.stringify(event),
      context: JSON.stringify(context),
    }),
  };
};

export { handler };

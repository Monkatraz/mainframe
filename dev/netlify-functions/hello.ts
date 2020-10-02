import type { Handler, Context, APIGatewayEvent } from 'aws-lambda'

const handler: Handler = async (event: APIGatewayEvent, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Hello world ${Math.floor(Math.random() * 10)}` })
  }
}

export { handler }
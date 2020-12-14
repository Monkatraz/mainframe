// TODO: convert to Vercel logic, if needed (can probably just client -> fauna now)
// Imports
import FaunaDB from 'faunadb'
const q = FaunaDB.query
import type { Handler, Context, APIGatewayEvent } from 'aws-lambda'

// Lib
function createResponse(status: number, body: any) {
  return { statusCode: status, body: JSON.stringify(body) }
}

const handler: Handler = async (event: APIGatewayEvent, context: Context) => {
  // Event Validations
  if (event.httpMethod !== 'POST') return createResponse(405, 'Method not allowed. Use POST.')

  try {
    // TODO: Validations
    // - Path
    // TODO: Logging
    // TODO: Purify HTML
    // TODO: Validate identity
    const data = JSON.parse(event.body)

    // Now we create our client for DB interaction as we're past validations
    const client = new FaunaDB.Client({
      secret: process.env.API_FDB_PRIVATE_SERVER_KEY
    })

    const pageExists = await client.query(q.Exists(q.Match(q.Index('pages_by_path'), data.path))) as boolean
    if (!pageExists) {
      // Create a new page
      // TODO: Page template
      const response = await client.query(q.Create(q.Collection('pages'), { data: data }))
      return createResponse(201, response)
    }
    // TODO: Page updating

  } catch (err) {
    // Return 'internal server error' object
    return createResponse(500, err)
  }
}

export { handler }
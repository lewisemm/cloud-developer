import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { decode } from 'jsonwebtoken'
import { Jwt } from '../../auth/Jwt'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODO_TABLE
const userIndex = process.env.USER_INDEX
const logger = createLogger('getTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user
  logger.info('Processing event: ', event)

  const token = getToken(event.headers.Authorization)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  const result = await docClient.query({
    TableName: todosTable,
    IndexName: userIndex,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
        ':userId': jwt.payload.sub
    }
  }).promise();

  const items = result.Items
  logger.info('Todo items retrieved')
  return {
    statusCode: 200,
    body: JSON.stringify({
      items
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

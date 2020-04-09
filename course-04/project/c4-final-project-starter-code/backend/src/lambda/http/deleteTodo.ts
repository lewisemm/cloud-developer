import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { decode } from 'jsonwebtoken'
import { Jwt } from '../../auth/Jwt'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const logger = createLogger('deleteTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const authToken = getToken(event.headers.Authorization)
  const jwt: Jwt = decode(authToken, { complete: true }) as Jwt
  const userId = jwt.payload.sub

  const validTodo = await todoExists(todoId, userId)

  if (!validTodo) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  // TODO: Remove a TODO item by id
  const params = {
    TableName:todoTable,
    Key: {
      userId,
      todoId
    },
    ReturnValues:"NONE"
  };

  logger.info(`Attempting to delete todo item of todoId: ${todoId}.`)

  const deletedResult = await docClient.delete(params).promise()

  return {
    statusCode: 204,
    body: JSON.stringify({
      deletedResult
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

async function todoExists(todoId: string, userId: string) {
  const result = await docClient
    .get({
      TableName: todoTable,
      Key: {
        userId,
        todoId
      }
    })
    .promise()

  logger.info('Get todo: ', result)
  return !!result.Item
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

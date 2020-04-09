import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { decode } from 'jsonwebtoken'
import { Jwt } from '../../auth/Jwt'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const logger = createLogger('updateTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(`Update information is`, updatedTodo)

  const authToken = getToken(event.headers.Authorization)
  const jwt: Jwt = decode(authToken, { complete: true }) as Jwt
  const userId = jwt.payload.sub

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const validTodo = await todoExists(todoId, userId)

  if (!validTodo) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  const params = {
    TableName:todoTable,
    Key: {
      userId,
      todoId
    },
    UpdateExpression: "set #title = :title, dueDate = :dueDate, done = :done",
    ExpressionAttributeNames: {
      "#title": "name"
    },
    ExpressionAttributeValues: {
      ":title": updatedTodo['name'],
      ":dueDate": updatedTodo['dueDate'],
      ":done": updatedTodo['done'],
    },
    ReturnValues:"NONE"
  };

  logger.info(`Attempting to update todo item of todoId: ${todoId}.`)

  const updatedItem = await docClient.update(params).promise()

  return {
    statusCode: 204,
    body: JSON.stringify({
      updatedItem
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

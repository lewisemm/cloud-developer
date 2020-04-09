import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
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

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const validTodo = await todoExists(todoId)

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

async function todoExists(todoId: string) {
handler.use(
  cors({
    credentials: true
  })
)

  const result = await docClient
    .get({
      TableName: todoTable,
      Key: {
        todoId
      }
    })
    .promise()

  logger.info('Get todo: ', result)
  return !!result.Item
}

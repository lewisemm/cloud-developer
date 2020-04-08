import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const logger = createLogger('deleteTodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const validTodo = await todoExists(todoId)

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
      todoId
    },
    ReturnValues:"NONE"
  };

  logger.info(`Attempting to delete todo item of todoId: ${todoId}.`)

  const deletedResult = await docClient.delete(params).promise()

  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      deletedResult
    })
  }
}


async function todoExists(todoId: string) {
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

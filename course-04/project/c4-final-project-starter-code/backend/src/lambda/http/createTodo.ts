import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Implement creating a new TODO item
  console.log('Processing event: ', event)

  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  // TODO: iMPLEMENT THIS ONCE AUTH IS FIGURED OUT
  // const authorization = event.headers.Authorization
  // const split = authorization.split(' ')
  // const jwtToken = split[1]
  // const userId = getUserId(jwtToken)
  const userId = 'abcde'

  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const newItem = {
    todoId,
    createdAt,
    ...newTodo,
    userId,
    done: false
  }

  await docClient.put({
    TableName: todoTable,
    Item: newItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      newItem
    })
  }

}

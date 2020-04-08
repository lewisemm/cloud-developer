import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import { decode } from 'jsonwebtoken'
import { Jwt } from '../../auth/Jwt'

import { createLogger } from '../../utils/logger'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const logger = createLogger('createTodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Implement creating a new TODO item
  logger.info('Data received: ', event.body)

  logger.info('In search of the authorization token', event.headers)

  const authToken = getToken(event.headers.Authorization)

  const jwt: Jwt = decode(authToken, { complete: true }) as Jwt

  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  // TODO: iMPLEMENT THIS ONCE AUTH IS FIGURED OUT
  // const authorization = event.headers.Authorization
  // const split = authorization.split(' ')
  // const jwtToken = split[1]
  // const userId = getUserId(jwtToken)
  const userId = jwt.payload.sub

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

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { deleteTodo, todoExists } from '../../businessLogic/todos'
import { getToken } from '../../auth/utils'

const logger = createLogger('deleteTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const jwtToken = getToken(event.headers.Authorization)

  const validTodo = await todoExists(todoId, jwtToken)

  if (!validTodo) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  // TODO: Remove a TODO item by id
  logger.info(`Attempting to delete todo item of todoId: ${todoId}.`)
  const deletedResult = deleteTodo(jwtToken, todoId)

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

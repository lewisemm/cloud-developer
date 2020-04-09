import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodo, todoExists } from '../../businessLogic/todos'
import { getToken } from '../../auth/utils'

const logger = createLogger('updateTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(`Update information is`, updatedTodo)
  const jwtToken = getToken(event.headers.Authorization)

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const validTodo = await todoExists(todoId, jwtToken)

  if (!validTodo) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  const updatedItem = await updateTodo(jwtToken, todoId, updatedTodo)

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

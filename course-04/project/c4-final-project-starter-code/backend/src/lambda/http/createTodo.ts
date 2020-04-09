import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { getToken } from '../../auth/utils'
import { createTodo } from '../../businessLogic/todos'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const logger = createLogger('createTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Implement creating a new TODO item

  const token = getToken(event.headers.Authorization)
  const createTodoRequest: CreateTodoRequest = JSON.parse(event.body)
  logger.info('Data received: ', createTodoRequest)

  const createdItem = await createTodo(createTodoRequest, token)

  return {
    statusCode: 201,
    body: JSON.stringify({
      items: createdItem
    })
  }

})

handler.use(
  cors({
    credentials: true
  })
)

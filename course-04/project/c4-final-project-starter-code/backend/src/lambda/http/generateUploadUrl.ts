import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { todoExists, getTodoUploadUrl, updateTodoAttachmentUrl } from '../../businessLogic/todos'
import { getToken } from '../../auth/utils'

const logger = createLogger('generateUploadUrl')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const jwtToken = getToken(event.headers.Authorization)

  const validTodo = await todoExists(todoId, jwtToken)

  if (!validTodo) {
    logger.info('Could not find a todo item with that todoId', todoId)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  const uploadUrl = await getTodoUploadUrl(todoId)

  logger.info('Attempting to update the attachmentUrl of item', validTodo)

  const updatedItem = await updateTodoAttachmentUrl(jwtToken, todoId)

  logger.info('attachmentUrl updated', updatedItem)
  

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl
    })
  }

})

handler.use(
  cors({
    credentials: true
  })
)

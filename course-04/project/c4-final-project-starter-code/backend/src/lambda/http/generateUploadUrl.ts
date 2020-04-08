import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})
const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const bucketName = process.env.ATTACHMENTS_S3_BUCKET

const logger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const validTodo = await todoExists(todoId)

  if (!validTodo) {
    logger.info('Could not find a todo item with that todoId', todoId)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  const uploadUrl = getUploadUrl(todoId)

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl
    })
  }

}

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
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

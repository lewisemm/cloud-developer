import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { TodoItem } from '../models/TodoItem'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todoTable: string = process.env.TODO_TABLE,
    private readonly userIndex: string = process.env.USER_INDEX,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET){
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient.query({
      TableName: this.todoTable,
      IndexName: this.userIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
          ':userId': userId
      }
    }).promise()

    return result.Items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todoTable,
      Item: todo
    }).promise() 

    return todo
  }

  async updateTodo(userId: string, todoId: string, updatedTodo): Promise<any> {
    const params = {
      TableName: this.todoTable,
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

    const updatedItem = await this.docClient.update(params).promise()
    return updatedItem

  }

  async deleteTodo(userId: string, todoId: string): Promise<any> {
    const params = {
      TableName: this.todoTable,
      Key: {
        userId,
        todoId
      },
      ReturnValues:"NONE"
    };
    const deletedResult = await this.docClient.delete(params).promise()
    return deletedResult
  }

  async getSingleTodo(todoId: string, userId: string) {
    const result = await this.docClient.get({
      TableName: this.todoTable,
      Key: {
        userId,
        todoId
      }
    }).promise()
    // return !!result.Item
    return result.Item
  }

  async getTodoUploadUrl(todoId: string): Promise<string> {
    const s3 = new XAWS.S3({
      signatureVersion: 'v4'
    })
    return s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
  }

  async updateTodoAttachmentUrl(userId: string, todoId: string): Promise<any> {
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    const params = {
      TableName: this.todoTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": attachmentUrl
      },
      ReturnValues:"NONE"
    };
  
    const updatedItem = await this.docClient.update(params).promise()
    return updatedItem
  }
}
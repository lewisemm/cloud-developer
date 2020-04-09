import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const todoAccess = new TodoAccess()

export async function getAllTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)
  return await todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {

  const userId = parseUserId(jwtToken)
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const done = false

  return await todoAccess.createTodo({
    todoId,
    userId,
    createdAt,
    done,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate
  })
}

export async function updateTodo(
  jwtToken: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<any> {
  const userId = parseUserId(jwtToken)

  return await todoAccess.updateTodo(userId, todoId, updateTodoRequest)
}

export async function deleteTodo(jwtToken: string,
  todoId: string
): Promise<any> {
  const userId = parseUserId(jwtToken)
  return await todoAccess.deleteTodo(userId, todoId)
}

export async function todoExists(
  todoId: string,
  jwtToken: string
): Promise<boolean> {
  const userId = parseUserId(jwtToken)
  const result = await todoAccess.getSingleTodo(todoId, userId)
  return !!result
}

export async function getTodoUploadUrl(todoId: string): Promise<string> {
  return await todoAccess.getTodoUploadUrl(todoId)
}

export async function updateTodoAttachmentUrl(
  jwtToken: string,
  todoId: string
): Promise<any> {
  const userId = parseUserId(jwtToken)
  return await todoAccess.updateTodoAttachmentUrl(userId, todoId)
}

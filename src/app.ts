import { randomUUID } from 'crypto'
import express, { NextFunction, Request, Response } from 'express'

import { Customer } from './types/customer'

const app = express()

app.use(express.json())

// Banco de dados em memória
const customers: Customer[] = []

// Middleware para verificar se existe um cliente com o CPF
function verifyExistsAcountCpf(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  // Captura o CPF do route params
  const { cpf } = request.params

  // Busca o cliente filtrando pelo CPF recebido no params
  const customer = customers.find((customer) => customer.cpf === cpf)
  // Verifica se customer existe, caso não, responde um erro para o cliente
  if (!customer) {
    return response.status(400).json({ message: 'Customer not found' })
  }

  request.customer = customer
  // Caso o cliente exista, o next faz com que o código continue executando normalmente
  next()
}

// ROTA: Cria um novo cliente
app.post('/account', (request, response) => {
  // Capturando parâmetros do body
  const { name, cpf } = request.body

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf,
  )

  if (customerAlreadyExists) {
    return response.status(400).json({ message: 'Customer already exists' })
  }

  // Criando objeto do customer
  const customer = {
    id: randomUUID(),
    name,
    cpf,
    statement: [],
  }

  // Adicionando customers a lista
  customers.push(customer)

  return response.status(201).json({
    message: 'Customer created ',
    data: customer,
  })
})

// Rota: Busca os dados de um cliente
app.get('/account/:cpf', verifyExistsAcountCpf, (request, response) => {
  const { customer } = request
  return response.json({ data: customer })
})

// Rota: Busca o extrato de um cliente
app.get('/statement/:cpf', verifyExistsAcountCpf, (request, response) => {
  const { customer } = request
  return response.json({ data: customer.statement })
})

export default app

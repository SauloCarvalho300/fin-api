import { randomUUID } from 'crypto'
import express from 'express'

import { verifyExistsAccount } from './middlewares/verify-exists-account'
import { Customer, Statement } from './types/customer'

const app = express()

app.use(express.json())

// Banco de dados em memória
export const customers: Customer[] = []

const minAmountOfDeposit = 0.1

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
app.get('/account/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request
  return response.json({ data: customer })
})

// Rota: Busca o extrato de um cliente
app.get('/statement/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request
  return response.json({ data: customer.statement })
})

// Rota: Deposita um valor a um cliente
app.post('/deposit/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request
  const { description, amount } = request.body as {
    description: string
    amount: number
  }

  if (amount < minAmountOfDeposit) {
    return response
      .status(400)
      .json({ message: 'Amount must be greater then the minimum amount' })
  }

  const statement: Statement = {
    description,
    amount,
    type: 'credit',
    createdAT: new Date(),
  }

  customer.statement.push(statement)

  return response.json({
    message: `Deposit worth ${amount} successfully made`,
  })
})

export default app

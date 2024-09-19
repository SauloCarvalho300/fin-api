import { randomUUID } from 'crypto'
import express from 'express'

import { Customer } from './types/customer'

const app = express()

app.use(express.json())

// Banco de dados em memória
const customers: Customer[] = []

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

app.get('/account/:cpf', (request, response) => {
  const { cpf } = request.params

  const customer = customers.find((customer) => customer.cpf === cpf)

  if (!customer) {
    return response.status(400).json({ message: 'Customer not found' })
  }

  return response.json({ data: customer })
})

export default app

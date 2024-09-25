import { randomUUID } from 'crypto'
import express from 'express'

import { verifyExistsAccount } from './middlewares/verify-exists-account'
import { Customer, Statement } from './types/customer'
import { getBalance } from './utils/get-balance'

const app = express()

app.use(express.json())

// Banco de dados em memória
export const customers: Customer[] = []

const minAmountOfDeposit = 0.1
const minAmountOfWithdraw = 0.1
const minAmountOfPix = 0.1
const maxAmountOfPix = 5000

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

// Rota: Atualizar dados do cliente
app.put('/account/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request
  const { name } = request.body as {
    name: string
  }

  // Reatribui o valor do nome com o valor vindo do body
  customer.name = name

  return response.json({ message: 'Account updated ' })
})

// Rota: Deleta um cliente
app.delete('/account/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request

  const balance = getBalance(customer.statement)

  if (balance > 0) {
    return response
      .status(400)
      .json({ message: 'You cannot delete an account having positive funds' })
  }

  if (balance < 0) {
    return response
      .status(400)
      .json({ message: 'You cannot delete an account having negative funds' })
  }

  const customerIndex = customers.findIndex((c) => c.cpf === customer.cpf)

  if (customerIndex !== -1) customers.splice(customerIndex, 1)

  return response.json({ message: 'Account deleted' })
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

// Rota: Busca o extrato de um cliente pela data
app.get('/statement/:cpf/date', verifyExistsAccount, (request, response) => {
  const { customer } = request
  const { date } = request.query as { date: string }

  // Formata a hora da data passada para meia noite
  const formatedDate = new Date(date + ' 00:00')

  // Filtra os extratos pela data, ignorando o tempo
  const statements = customer.statement.filter(
    (statement) =>
      new Date(statement.createdAT).toDateString() ===
      new Date(formatedDate).toDateString(),
  )

  return response.json({ data: statements })
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

// Rota: Saca um valor de um cliente
app.post('/withdraw/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request
  const { description, amount } = request.body as {
    description: string
    amount: number
  }

  if (amount < minAmountOfWithdraw) {
    return response
      .status(400)
      .json({ message: 'Amount must be greater them the minimum amount' })
  }

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return response.status(400).json({ message: 'Insufficient funds!' })
  }

  const statement: Statement = {
    description,
    amount,
    type: 'debit',
    createdAT: new Date(),
  }

  customer.statement.push(statement)

  return response.json({ message: 'Successfully withdraw ' })
})

// Rota: Busca o saldo atual do cliente
app.get('/balance/:cpf', verifyExistsAccount, (request, response) => {
  const { customer } = request

  // Busca o saldo atual de acordo com o extrato do cliente
  const balance = getBalance(customer.statement)

  return response.json({ data: { balance } })
})

// Rota: Realiza um pix de uma conta para outra
app.post('/pix/:cpf', verifyExistsAccount, (request, response) => {
  const { customer: senderCustomer } = request
  const { target, amount, description } = request.body as {
    target: string
    amount: number
    description: string
  }

  // Verifica se o CPF do remetente é igual do destinatário
  if (senderCustomer.cpf === target) {
    return response
      .status(400)
      .json({ message: 'You cannot send a pix to yourself' })
  }

  // Verifica se o alvo do pix(cliente) existe
  const targetCustomer = customers.find((customer) => customer.cpf === target)

  if (!targetCustomer) {
    return response.status(400).json({ message: 'Tarhet customer not found' })
  }

  // Verifica se o pix é maior que o limite mínimo
  if (amount < minAmountOfPix) {
    return response
      .status(400)
      .json({ message: 'Amount must be greater then the minimum amount' })
  }

  if (amount > maxAmountOfPix) {
    return response.status(400).json({
      message: 'Amount must be less then or equal to the maximum amount',
    })
  }

  // Verifica se o saldo do remetente tem saldo suficiente
  const senderBalance = getBalance(senderCustomer.statement)

  if (senderBalance < amount) {
    return response.status(400).json({ message: 'insufficient funds' })
  }

  // Cria a transação do remetente
  const statementSender: Statement = {
    description,
    amount,
    type: 'debit',
    createdAT: new Date(),
  }

  // Criar a trasanção do destinatário
  const statementTarget: Statement = {
    description: `Pix recebido de ${senderCustomer.name}`,
    amount,
    type: 'credit',
    createdAT: new Date(),
  }

  // Adiciona as trasações aos respectivos clientes
  senderCustomer.statement.push(statementSender)
  targetCustomer.statement.push(statementTarget)

  return response.json({ message: 'Pix sent sucessfully' })
})

export default app

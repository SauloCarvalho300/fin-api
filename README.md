# fin API = Financeira

## Requisitos

- [X] Deve ser possível criar uma conta
- [X] Deve ser possível buscar o extrato bancário do cliente
- [X] Deve ser possível realizar um depósito
- [X] Deve ser possível realizar um saque
- [] Deve ser possível realizar uma transferência via PIX
- [] Deve ser possível buscar o extrato bancário do cliente por data
- [] Deve ser possível atualizar dados da conta do cliente
- [] Deve ser possível buscar o balanço da conta do cliente
- [X] Deve ser possível obter os dados da conta do cliente
- [] Deve ser possível deletar uma conta
- 

## Regras de negócio

- [X] Não deve ser possível cadastrar uma conta com CPF já existente
- [X] Não deve ser possível fazer um depósito em uma conta não existente
- [X] Não deve ser possível fazer um depósito/saque menor que o depósito mínimo
- [] Não deve ser possível buscar o extrato em uma conta não existente
- [] Não deve ser possível fazer um saque em uma conta não existente
- [] Não deve ser possível fazer um pix de/para uma conta não existente
- [] Não deve ser possível excluir uma conta não existente
- [] Não deve ser possível fazer um saque quando o saldo for insuficiente
- [] Não deve ser possível fazer um pix para si mesmo
- [] Não deve ser possível fazer um pix quand o saldo for insuficiente
- [] Não deve ser possível fazer um pix acima do limite permitido
- [] Não deve ser possível excluir uma conta com saldo negativo/positivo
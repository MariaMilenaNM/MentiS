import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pacienteCadastroSchema } from './validation.js';

const valido = { nome: 'Teste', email: 'teste@teste.com', senha: 'senha123', aceiteLGPD: true };
const campoComErro = (dados) => pacienteCadastroSchema.safeParse(dados).error?.issues[0].path[0];

test('aceita só nome, e-mail, senha e aceite LGPD', () => {
  assert.deepEqual(pacienteCadastroSchema.parse(valido), valido);
});

test('recusa aceite LGPD falso ou ausente', () => {
  assert.equal(campoComErro({ ...valido, aceiteLGPD: false }), 'aceiteLGPD');
  const { aceiteLGPD, ...semAceite } = valido;
  assert.equal(campoComErro(semAceite), 'aceiteLGPD');
});

test('recusa aceite LGPD que não seja booleano', () => {
  assert.equal(campoComErro({ ...valido, aceiteLGPD: 'true' }), 'aceiteLGPD');
});

test('recusa nome em branco, e-mail inválido e senha curta', () => {
  assert.equal(campoComErro({ ...valido, nome: '   ' }), 'nome');
  assert.equal(campoComErro({ ...valido, email: 'invalido' }), 'email');
  assert.equal(campoComErro({ ...valido, senha: '123' }), 'senha');
});

test('descarta campos desconhecidos, como role', () => {
  const dados = pacienteCadastroSchema.parse({ ...valido, role: 'ADMIN' });
  assert.equal('role' in dados, false);
});

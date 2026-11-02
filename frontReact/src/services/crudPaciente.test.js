import { cadastrarPaciente } from './crudPaciente';

const respostaFetch = (status, corpo) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => corpo,
});

describe('cadastrarPaciente', () => {
  const dados = { nome: 'Teste', email: 'teste@teste.com', senha: 'senha123', aceiteLGPD: true };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envia ao backend só nome, e-mail, senha e aceite LGPD', async () => {
    fetch.mockResolvedValue(respostaFetch(201, { status: 'ok' }));
    const resultado = await cadastrarPaciente(dados);
    expect(fetch.mock.calls[0][0]).toMatch(/\/pacientes\/cadastrar$/);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(dados);
    expect(resultado.status).toBe('ok');
  });

  it('retorna duplicado no status 409', async () => {
    fetch.mockResolvedValue(respostaFetch(409, { erro: 'E-mail já cadastrado' }));
    expect(await cadastrarPaciente(dados)).toEqual({
      status: 'duplicado',
      erro: 'E-mail já cadastrado',
    });
  });

  it('mostra a mensagem do campo quando a validação falha', async () => {
    fetch.mockResolvedValue(
      respostaFetch(400, {
        erro: 'Dados inválidos',
        detalhes: [{ campo: 'aceiteLGPD', mensagem: 'É necessário aceitar os termos da LGPD' }],
      })
    );
    expect(await cadastrarPaciente(dados)).toEqual({
      status: 'erro',
      erro: 'É necessário aceitar os termos da LGPD',
    });
  });
});

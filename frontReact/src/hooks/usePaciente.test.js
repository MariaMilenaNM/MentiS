import { renderHook, act } from '@testing-library/react';
import { usePaciente } from './usePaciente';
import { cadastrarPaciente, buscarPaciente } from '../services/crudPaciente';

vi.mock('../services/crudPaciente', () => ({
  cadastrarPaciente: vi.fn(),
  buscarPaciente: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('usePaciente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  describe('handleLogin', () => {
    it('deve mostrar erro se email ou senha estiverem vazios', async () => {
      const { result } = renderHook(() => usePaciente());
      await act(async () => {
        result.current.handleLogin();
      });
      expect(result.current.loginErro).toBe('Preencha e-mail e senha.');
    });

    it('deve mostrar erro se email for inválido', async () => {
      const { result } = renderHook(() => usePaciente());
      act(() => {
        result.current.setLoginEmail('email-invalido');
        result.current.setLoginSenha('senha123');
      });
      await act(async () => {
        result.current.handleLogin();
      });
      expect(result.current.loginErro).toBe('E-mail inválido.');
    });

    it('deve navegar para /painel em login bem-sucedido', async () => {
      const { result } = renderHook(() => usePaciente());
      buscarPaciente.mockResolvedValue({
        status: 'ok',
        paciente: { id: 1, nome: 'Teste', email: 'teste@teste.com' },
        token: 'fake-token',
      });
      act(() => {
        result.current.setLoginEmail('teste@teste.com');
        result.current.setLoginSenha('senha123');
      });
      await act(async () => {
        result.current.handleLogin();
      });
      expect(buscarPaciente).toHaveBeenCalledWith('teste@teste.com', 'senha123');
      expect(mockNavigate).toHaveBeenCalledWith('/painel');
      expect(result.current.loginErro).toBe('');
    });

    it('deve mostrar erro se credenciais forem inválidas', async () => {
      const { result } = renderHook(() => usePaciente());
      buscarPaciente.mockResolvedValue({ status: 'erro', erro: 'Credenciais inválidas' });
      act(() => {
        result.current.setLoginEmail('teste@teste.com');
        result.current.setLoginSenha('senhaerrada');
      });
      await act(async () => {
        result.current.handleLogin();
      });
      expect(result.current.loginErro).toBe('Credenciais inválidas');
    });
  });

  describe('handleCadastro', () => {
    const preencher = (result, sobrescrever = {}) => {
      const v = {
        nome: 'Teste',
        email: 'teste@teste.com',
        senha: 'senha123',
        conf: 'senha123',
        aceite: true,
        ...sobrescrever,
      };
      act(() => {
        result.current.setCadNome(v.nome);
        result.current.setCadEmail(v.email);
        result.current.setCadSenha(v.senha);
        result.current.setCadSenhaConf(v.conf);
        result.current.setCadAceite(v.aceite);
      });
    };

    it('deve mostrar erro se campos obrigatórios estiverem vazios', async () => {
      const { result } = renderHook(() => usePaciente());
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(result.current.cadErro).toBe('Preencha todos os campos!');
    });

    it('deve mostrar erro se email for inválido', async () => {
      const { result } = renderHook(() => usePaciente());
      preencher(result, { email: 'email-invalido' });
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(result.current.cadErro).toBe('E-mail inválido.');
    });

    it('deve mostrar erro se senhas não coincidirem', async () => {
      const { result } = renderHook(() => usePaciente());
      preencher(result, { conf: 'senha456' });
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(result.current.cadErro).toBe('As senhas não coincidem!');
    });

    it('deve mostrar erro se senha for muito curta', async () => {
      const { result } = renderHook(() => usePaciente());
      preencher(result, { senha: '123', conf: '123' });
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(result.current.cadErro).toBe('A senha precisa ter pelo menos 6 caracteres.');
    });

    it('não deve cadastrar sem o aceite LGPD', async () => {
      const { result } = renderHook(() => usePaciente());
      preencher(result, { aceite: false });
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(result.current.cadErro).toBe(
        'É necessário aceitar os termos da LGPD para criar a conta.'
      );
      expect(cadastrarPaciente).not.toHaveBeenCalled();
    });

    it('deve cadastrar com aceite e mudar para tela de login com aviso de sucesso', async () => {
      const { result } = renderHook(() => usePaciente());
      cadastrarPaciente.mockResolvedValue({ status: 'ok' });
      act(() => {
        result.current.setTelaAtual('cadastro');
      });
      preencher(result);
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(cadastrarPaciente).toHaveBeenCalledWith({
        nome: 'Teste',
        email: 'teste@teste.com',
        senha: 'senha123',
        aceiteLGPD: true,
      });
      expect(result.current.telaAtual).toBe('login');
      expect(result.current.sucessoMsg).toBe(
        'Conta criada com sucesso! Faça login para continuar.'
      );
      expect(result.current.cadAceite).toBe(false);
    });

    it('deve manter o erro visível na tela de cadastro se email já cadastrado', async () => {
      const { result } = renderHook(() => usePaciente());
      cadastrarPaciente.mockResolvedValue({
        status: 'duplicado',
        erro: 'Já existe uma conta com este e-mail',
      });
      act(() => {
        result.current.setTelaAtual('cadastro');
      });
      preencher(result);
      await act(async () => {
        result.current.handleCadastro();
      });
      expect(result.current.cadErro).toBe('Já existe uma conta com este e-mail');
      expect(result.current.telaAtual).toBe('cadastro');
    });
  });
});

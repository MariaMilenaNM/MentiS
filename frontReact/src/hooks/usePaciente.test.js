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
      await act(async () => { result.current.handleLogin(); });
      expect(result.current.loginErro).toBe('Preencha e-mail e senha.');
    });

    it('deve mostrar erro se email for inválido', async () => {
      const { result } = renderHook(() => usePaciente());
      act(() => { result.current.setLoginEmail('email-invalido'); result.current.setLoginSenha('senha123'); });
      await act(async () => { result.current.handleLogin(); });
      expect(result.current.loginErro).toBe('E-mail inválido.');
    });

    it('deve navegar para /painel em login bem-sucedido', async () => {
      const { result } = renderHook(() => usePaciente());
      buscarPaciente.mockResolvedValue({ status: 'ok', paciente: { id: 1, nome: 'Teste', email: 'teste@teste.com' }, token: 'fake-token' });
      act(() => { result.current.setLoginEmail('teste@teste.com'); result.current.setLoginSenha('senha123'); });
      await act(async () => { result.current.handleLogin(); });
      expect(buscarPaciente).toHaveBeenCalledWith('teste@teste.com', 'senha123');
      expect(mockNavigate).toHaveBeenCalledWith('/painel');
      expect(result.current.loginErro).toBe('');
    });

    it('deve mostrar erro se credenciais forem inválidas', async () => {
      const { result } = renderHook(() => usePaciente());
      buscarPaciente.mockResolvedValue({ status: 'erro', erro: 'Credenciais inválidas' });
      act(() => { result.current.setLoginEmail('teste@teste.com'); result.current.setLoginSenha('senhaerrada'); });
      await act(async () => { result.current.handleLogin(); });
      expect(result.current.loginErro).toBe('Credenciais inválidas');
    });
  });

  describe('handleCadastro', () => {
    it('deve mostrar erro se campos obrigatórios estiverem vazios', async () => {
      const { result } = renderHook(() => usePaciente());
      await act(async () => { result.current.handleCadastro(); });
      expect(result.current.cadErro).toBe('Preencha todos os campos!');
    });

    it('deve mostrar erro se email for inválido', async () => {
      const { result } = renderHook(() => usePaciente());
      act(() => { result.current.setCadNome('Teste'); result.current.setCadData('2000-01-01'); result.current.setCadEmail('email-invalido'); result.current.setCadTelefone('(11) 99999-9999'); result.current.setCadCidade('São Paulo'); result.current.setCadEstado('SP'); result.current.setCadSenha('senha123'); result.current.setCadSenhaConf('senha123'); });
      await act(async () => { result.current.handleCadastro(); });
      expect(result.current.cadErro).toBe('E-mail inválido.');
    });

    it('deve mostrar erro se senhas não coincidirem', async () => {
      const { result } = renderHook(() => usePaciente());
      act(() => { result.current.setCadNome('Teste'); result.current.setCadData('2000-01-01'); result.current.setCadEmail('teste@teste.com'); result.current.setCadTelefone('(11) 99999-9999'); result.current.setCadCidade('São Paulo'); result.current.setCadEstado('SP'); result.current.setCadSenha('senha123'); result.current.setCadSenhaConf('senha456'); });
      await act(async () => { result.current.handleCadastro(); });
      expect(result.current.cadErro).toBe('As senhas não coincidem!');
    });

    it('deve mostrar erro se senha for muito curta', async () => {
      const { result } = renderHook(() => usePaciente());
      act(() => { result.current.setCadNome('Teste'); result.current.setCadData('2000-01-01'); result.current.setCadEmail('teste@teste.com'); result.current.setCadTelefone('(11) 99999-9999'); result.current.setCadCidade('São Paulo'); result.current.setCadEstado('SP'); result.current.setCadSenha('123'); result.current.setCadSenhaConf('123'); });
      await act(async () => { result.current.handleCadastro(); });
      expect(result.current.cadErro).toBe('A senha precisa ter pelo menos 6 caracteres.');
    });

    it('deve cadastrar com sucesso e mudar para tela de login', async () => {
      const { result } = renderHook(() => usePaciente());
      cadastrarPaciente.mockResolvedValue({ status: 'ok' });
      act(() => { result.current.setCadNome('Teste'); result.current.setCadData('2000-01-01'); result.current.setCadEmail('teste@teste.com'); result.current.setCadTelefone('(11) 99999-9999'); result.current.setCadCidade('São Paulo'); result.current.setCadEstado('SP'); result.current.setCadSenha('senha123'); result.current.setCadSenhaConf('senha123'); });
      await act(async () => { result.current.handleCadastro(); });
      expect(cadastrarPaciente).toHaveBeenCalledWith('Teste', '2000-01-01', 'teste@teste.com', '(11) 99999-9999', 'São Paulo', 'SP', 'senha123');
      expect(result.current.telaAtual).toBe('login');
    });

    it('deve mostrar erro se email já cadastrado', async () => {
      const { result } = renderHook(() => usePaciente());
      cadastrarPaciente.mockResolvedValue({ status: 'duplicado', erro: 'Já existe uma conta com este e-mail' });
      act(() => { result.current.setCadNome('Teste'); result.current.setCadData('2000-01-01'); result.current.setCadEmail('teste@teste.com'); result.current.setCadTelefone('(11) 99999-9999'); result.current.setCadCidade('São Paulo'); result.current.setCadEstado('SP'); result.current.setCadSenha('senha123'); result.current.setCadSenhaConf('senha123'); });
      await act(async () => { result.current.handleCadastro(); });
      expect(result.current.cadErro).toBe('Já existe uma conta com este e-mail');
      expect(result.current.telaAtual).toBe('login');
    });
  });
});
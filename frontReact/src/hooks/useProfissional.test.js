import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfissional } from './useProfissional';
import {
  getProfissionais,
  criarProfissional,
  buscarProfissionalPorId,
  atualizarProfissionalBd,
  deletarProfissionalBd
} from '../services/crudProfissional';

// Mock dos services
vi.mock('../services/crudProfissional', () => ({
  getProfissionais: vi.fn(),
  criarProfissional: vi.fn(),
  buscarProfissionalPorId: vi.fn(),
  atualizarProfissionalBd: vi.fn(),
  deletarProfissionalBd: vi.fn(),
}));

// Mock de window.confirm
global.confirm = vi.fn(() => true);

describe('useProfissional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm.mockReturnValue(true);
  });

  describe('carregarTabela', () => {
    it('deve carregar profissionais na inicialização', async () => {
      const mockProfissionais = [
        { id: 1, nome: 'Psicólogo 1', crp: 12345, modalidade: 'Presencial' },
        { id: 2, nome: 'Psicólogo 2', crp: 54321, modalidade: 'Remota' }
      ];
      getProfissionais.mockResolvedValue(mockProfissionais);

      const { result } = renderHook(() => useProfissional());

      await waitFor(() => {
        expect(result.current.profissionais).toEqual(mockProfissionais);
      });
    });

    it('deve lidar com erro ao carregar profissionais', async () => {
      getProfissionais.mockRejectedValue(new Error('Erro de rede'));

      const { result } = renderHook(() => useProfissional());

      await waitFor(() => {
        expect(result.current.profissionais).toEqual([]);
      });
    });
  });

  describe('handleCreate', () => {
    it('deve validar campos obrigatórios', async () => {
      getProfissionais.mockResolvedValue([]);
      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.handleCreate();
      });

      expect(result.current.formErros).toHaveProperty('nome');
      expect(result.current.formErros).toHaveProperty('crp');
      expect(result.current.formErros).toHaveProperty('modalidade');
      expect(result.current.formErros).toHaveProperty('numero');
      expect(result.current.formErros).toHaveProperty('contato');
    });

    it('deve validar CRP como número positivo', async () => {
      getProfissionais.mockResolvedValue([]);
      const { result } = renderHook(() => useProfissional());

      act(() => {
        result.current.setForm({
          nome: 'Teste',
          crp: '-1',
          modPresencial: true,
          modRemota: false,
          link: '',
          numero: '(11) 99999-9999',
          contato: 'teste@teste.com'
        });
      });

      await act(async () => {
        result.current.handleCreate();
      });

      expect(result.current.formErros.crp).toBe('CRP deve ser um número positivo');
    });

    it('deve validar formato de telefone', async () => {
      getProfissionais.mockResolvedValue([]);
      const { result } = renderHook(() => useProfissional());

      act(() => {
        result.current.setForm({
          nome: 'Teste',
          crp: '12345',
          modPresencial: true,
          modRemota: false,
          link: '',
          numero: 'telefone-invalido',
          contato: 'teste@teste.com'
        });
      });

      await act(async () => {
        result.current.handleCreate();
      });

      expect(result.current.formErros.numero).toBe('Telefone inválido. Use formato (XX) XXXXX-XXXX');
    });

    it('deve validar email de contato', async () => {
      getProfissionais.mockResolvedValue([]);
      const { result } = renderHook(() => useProfissional());

      act(() => {
        result.current.setForm({
          nome: 'Teste',
          crp: '12345',
          modPresencial: true,
          modRemota: false,
          link: '',
          numero: '(11) 99999-9999',
          contato: 'email-invalido'
        });
      });

      await act(async () => {
        result.current.handleCreate();
      });

      expect(result.current.formErros.contato).toBe('E-mail de contato inválido');
    });

    it('deve chamar criarProfissional com dados válidos', async () => {
      getProfissionais.mockResolvedValue([]);
      criarProfissional.mockResolvedValue({ id: 1, nome: 'Novo' });

      const { result } = renderHook(() => useProfissional());

      act(() => {
        result.current.setForm({
          nome: 'Novo Psicólogo',
          crp: '67890',
          modPresencial: true,
          modRemota: false,
          link: 'https://instagram.com/novo',
          numero: '(11) 88888-8888',
          contato: 'novo@teste.com'
        });
      });

      await act(async () => {
        result.current.handleCreate();
      });

      expect(criarProfissional).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Novo Psicólogo',
          crp: 67890,
          modalidade: 'Presencial',
          numero: '(11) 88888-8888',
          contato: 'novo@teste.com'
        })
      );
    });

    it('deve mostrar erro se criarProfissional falhar', async () => {
      getProfissionais.mockResolvedValue([]);
      criarProfissional.mockRejectedValue(new Error('Erro ao criar'));

      const { result } = renderHook(() => useProfissional());

      act(() => {
        result.current.setForm({
          nome: 'Teste',
          crp: '12345',
          modPresencial: true,
          modRemota: false,
          link: '',
          numero: '(11) 99999-9999',
          contato: 'teste@teste.com'
        });
      });

      await act(async () => {
        result.current.handleCreate();
      });

      expect(result.current.formErros.submit).toBe('Erro ao criar profissional. Tente novamente.');
    });
  });

  describe('abrirEdicao', () => {
    it('deve buscar profissional e preencher formulário de edição', async () => {
      getProfissionais.mockResolvedValue([]);
      const mockProfissional = { id: 1, nome: 'Teste', crp: 12345, modalidade: 'Presencial', link: 'https://instagram.com/teste', numero: '(11) 99999-9999', contato: 'teste@teste.com' };
      buscarProfissionalPorId.mockResolvedValue(mockProfissional);

      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.abrirEdicao(1);
      });

      expect(buscarProfissionalPorId).toHaveBeenCalledWith(1);
      expect(result.current.editForm).toEqual(mockProfissional);
    });
  });

  describe('handleUpdate', () => {
    it('deve validar campos na edição', async () => {
      getProfissionais.mockResolvedValue([]);
      const mockProfissional = { id: 1, nome: 'Teste', crp: 12345, modalidade: 'Presencial', link: '', numero: '(11) 99999-9999', contato: 'teste@teste.com' };
      buscarProfissionalPorId.mockResolvedValue(mockProfissional);

      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.abrirEdicao(1);
      });

      act(() => {
        result.current.setEditForm({ ...mockProfissional, nome: '' });
      });

      await act(async () => {
        result.current.handleUpdate();
      });

      expect(result.current.editErros).toHaveProperty('nome');
    });

    it('deve chamar atualizarProfissionalBd com dados válidos', async () => {
      getProfissionais.mockResolvedValue([]);
      const mockProfissional = { id: 1, nome: 'Teste', crp: 12345, modalidade: 'Presencial', link: '', numero: '(11) 99999-9999', contato: 'teste@teste.com' };
      buscarProfissionalPorId.mockResolvedValue(mockProfissional);
      atualizarProfissionalBd.mockResolvedValue({ ...mockProfissional, nome: 'Teste Atualizado' });

      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.abrirEdicao(1);
      });

      act(() => {
        result.current.setEditForm({ ...mockProfissional, nome: 'Teste Atualizado' });
      });

      await act(async () => {
        result.current.handleUpdate();
      });

      expect(atualizarProfissionalBd).toHaveBeenCalledWith(1, expect.objectContaining({ nome: 'Teste Atualizado' }));
      expect(result.current.editForm).toBeNull();
    });

    it('deve mostrar erro se atualizarProfissionalBd falhar', async () => {
      getProfissionais.mockResolvedValue([]);
      const mockProfissional = { id: 1, nome: 'Teste', crp: 12345, modalidade: 'Presencial', link: '', numero: '(11) 99999-9999', contato: 'teste@teste.com' };
      buscarProfissionalPorId.mockResolvedValue(mockProfissional);
      atualizarProfissionalBd.mockRejectedValue(new Error('Erro ao atualizar'));

      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.abrirEdicao(1);
      });

      act(() => {
        result.current.setEditForm({ ...mockProfissional, nome: 'Teste Atualizado' });
      });

      await act(async () => {
        result.current.handleUpdate();
      });

      expect(result.current.editErros.submit).toBe('Erro ao atualizar profissional. Tente novamente.');
    });
  });

  describe('handleDelete', () => {
    it('deve confirmar antes de excluir', async () => {
      getProfissionais.mockResolvedValue([]);
      global.confirm.mockReturnValue(false);
      deletarProfissionalBd.mockResolvedValue({});

      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.handleDelete(1);
      });

      expect(deletarProfissionalBd).not.toHaveBeenCalled();
    });

    it('deve chamar deletarProfissionalBd com confirmação', async () => {
      getProfissionais.mockResolvedValue([]);
      global.confirm.mockReturnValue(true);
      deletarProfissionalBd.mockResolvedValue({});

      const { result } = renderHook(() => useProfissional());

      await act(async () => {
        result.current.handleDelete(1);
      });

      expect(deletarProfissionalBd).toHaveBeenCalledWith(1);
    });
  });
});
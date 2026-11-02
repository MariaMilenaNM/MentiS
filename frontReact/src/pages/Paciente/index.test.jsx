import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Paciente from './index';
import { cadastrarPaciente } from '../../services/crudPaciente';

// O setup global simula o router; esta página precisa do real por causa do <Link>
vi.unmock('react-router-dom');

vi.mock('../../services/crudPaciente', () => ({
  cadastrarPaciente: vi.fn(),
  buscarPaciente: vi.fn(),
}));

describe('Cadastro de paciente', () => {
  const abrirCadastro = async (user) => {
    render(
      <MemoryRouter>
        <Paciente />
      </MemoryRouter>
    );
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
  };

  const preencher = async (user) => {
    await user.type(screen.getByLabelText('Nome completo'), 'Ana');
    await user.type(screen.getByLabelText('E-mail'), 'ana@teste.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.type(screen.getByLabelText('Confirmar senha'), 'senha123');
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pede só nome, e-mail, senha e aceite LGPD', async () => {
    const user = userEvent.setup();
    await abrirCadastro(user);
    expect(screen.getByRole('checkbox', { name: /LGPD/ })).not.toBeChecked();
    expect(screen.queryByLabelText('Telefone')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Data de nascimento')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cidade')).not.toBeInTheDocument();
  });

  it('bloqueia o envio até marcar o aceite e depois mostra o sucesso no login', async () => {
    const user = userEvent.setup();
    cadastrarPaciente.mockResolvedValue({ status: 'ok' });
    await abrirCadastro(user);
    await preencher(user);

    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByRole('alert')).toHaveTextContent('aceitar os termos da LGPD');
    expect(cadastrarPaciente).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: /LGPD/ }));
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(cadastrarPaciente).toHaveBeenCalledWith({
      nome: 'Ana',
      email: 'ana@teste.com',
      senha: 'senha123',
      aceiteLGPD: true,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Conta criada com sucesso');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});

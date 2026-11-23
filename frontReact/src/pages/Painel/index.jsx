import { usePainel } from '../../hooks/usePainel';
import { useState, useMemo } from 'react';
import '../../styles/painel.css';
import TriageChatWidget from '../../components/TriageChatWidget';

export default function Painel() {
  const {
    pacienteLogado,
    sidebarAberta,
    modoEdicao,
    paginaAtual,
    setPaginaAtual,
    editForm,
    setEditForm,
    editErro,
    sucessoMsg,
    limparSucessoMsg,
    formatarData,
    toggleSidebar,
    toggleEdicao,
    salvarEdicao,
    sair,
    profissionaisPagina,
    totalPaginas,
    todosProfissionais,
    // Filtros
    filtros,
    setFiltroEspecialidade,
    setFiltroPrecoMax,
    setFiltroModalidade,
    limparFiltros,
    especialidadesDisponiveis,
    // Agendamento
    agendandoProfissionalId,
    horariosDisponiveis,
    agendamentoCarregando,
    agendamentoErro,
    agendamentoSucesso,
    abrirAgendamento,
    fecharAgendamento,
    confirmarAgendamento,
    // Minha Agenda
    minhaAgendaAberta,
    meusAgendamentos,
    agendamentosCarregando,
    abrirMinhaAgenda,
    fecharMinhaAgenda,
    cancelarMeuAgendamento,
  } = usePainel();

  // Estado local para o modal de agendamento
  const [agendamentoData, setAgendamentoData] = useState('');
  const [agendamentoHora, setAgendamentoHora] = useState('');
  const [agendamentoObservacoes, setAgendamentoObservacoes] = useState('');
  const [slotSelecionado, setSlotSelecionado] = useState(null);

  // Extrair datas únicas dos horários disponíveis
  const datasDisponiveis = useMemo(() => {
    if (!horariosDisponiveis || horariosDisponiveis.length === 0) return [];
    const datas = [...new Set(horariosDisponiveis.map((h) => h.data))];
    return datas.sort();
  }, [horariosDisponiveis]);

  // Filtrar horários para a data selecionada
  const horariosDoDia = useMemo(() => {
    if (!agendamentoData || !horariosDisponiveis) return [];
    return horariosDisponiveis
      .filter((h) => h.data === agendamentoData)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [agendamentoData, horariosDisponiveis]);

  const handleAgendamentoSubmit = (e) => {
    e.preventDefault();
    if (!slotSelecionado) return;

    confirmarAgendamento(slotSelecionado.dataHora, agendamentoObservacoes);
  };

  const handleSlotClick = (slot) => {
    setSlotSelecionado(slot);
    setAgendamentoData(slot.data);
    setAgendamentoHora(slot.hora);
  };

  if (!pacienteLogado)
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        Carregando...
      </div>
    );

  // Buscar profissional selecionado para agendamento
  const profissionalAgendando = agendandoProfissionalId
    ? todosProfissionais.find((p) => p.id === agendandoProfissionalId)
    : null;

  return (
    <div className="painel-wrapper">
      <aside
        className={`sidebar ${sidebarAberta ? '' : 'sidebar-fechada'}`}
        id="sidebar"
        role="complementary"
        aria-label="Perfil do paciente"
      >
        <button
          className="btn-toggle-sidebar"
          onClick={toggleSidebar}
          title={sidebarAberta ? 'Recolher painel' : 'Expandir painel'}
          aria-expanded={sidebarAberta}
          aria-controls="sidebar-conteudo"
        >
          &#9776;
        </button>

        <div
          className="sidebar-conteudo"
          id="sidebar-conteudo"
          style={{ display: sidebarAberta ? 'block' : 'none' }}
        >
          <div className="avatar" aria-hidden="true">
            {pacienteLogado.nome.charAt(0).toUpperCase()}
          </div>
          <h2 className="sidebar-nome">{pacienteLogado.nome}</h2>
          <span className="sidebar-tag">Paciente Mentis</span>

          <hr className="sidebar-divider" />

          <div className="info-item">
            <span className="info-label">E-MAIL</span>
            <span className="info-valor">{pacienteLogado.usuario?.email || '–'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">TELEFONE</span>
            <span className="info-valor">{pacienteLogado.telefone || '–'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">NASCIMENTO</span>
            <span className="info-valor">{formatarData(pacienteLogado.dataNasc)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">CIDADE / ESTADO</span>
            <span className="info-valor">
              {pacienteLogado.cidade ? `${pacienteLogado.cidade} / ${pacienteLogado.estado}` : '–'}
            </span>
          </div>

          <hr className="sidebar-divider" />

          <button className="btn-editar" onClick={toggleEdicao} aria-expanded={modoEdicao}>
            {modoEdicao ? 'Cancelar Edição' : 'Editar Perfil'}
          </button>

          {modoEdicao && (
            <div id="formEditar" style={{ marginTop: '14px' }}>
              {sucessoMsg && (
                <div
                  className="sucesso-mensagem"
                  role="status"
                  aria-live="polite"
                  onClick={limparSucessoMsg}
                  style={{ cursor: 'pointer' }}
                >
                  {sucessoMsg}
                </div>
              )}
              {editErro && (
                <div className="erro-mensagem" role="alert" aria-live="polite">
                  {editErro}
                </div>
              )}
              <div className="campo-edit">
                <label htmlFor="editNome">Nome</label>
                <input
                  type="text"
                  id="editNome"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                />
              </div>
              <div className="campo-edit">
                <label htmlFor="editTelefone">Telefone</label>
                <input
                  type="tel"
                  id="editTelefone"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                />
              </div>
              <div className="campo-edit">
                <label htmlFor="editCidade">Cidade</label>
                <input
                  type="text"
                  id="editCidade"
                  value={editForm.cidade}
                  onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })}
                />
              </div>
              <div className="campo-edit">
                <label htmlFor="editEstado">Estado</label>
                <select
                  id="editEstado"
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              <button className="btn-salvar-edit" onClick={salvarEdicao}>
                Salvar
              </button>
              <button className="btn-cancelar-edit" onClick={toggleEdicao}>
                Cancelar
              </button>
            </div>
          )}

          <button className="btn-sair-painel" onClick={sair}>
            Sair
          </button>
        </div>
      </aside>

      <main className="painel-main" role="main">
        <div className="painel-header">
          <h1>Profissionais Disponíveis</h1>
          <p>Encontre o profissional ideal para o seu atendimento em nossa rede de parceiros.</p>
          <button
            className="btn-minha-agenda"
            onClick={abrirMinhaAgenda}
            aria-label="Abrir minha agenda"
          >
            Minha Agenda
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="filtros-bar" role="search" aria-label="Filtros de profissionais">
          <div className="filtros-grupo">
            <label htmlFor="filtro-especialidade" className="filtro-label">
              Especialidade
            </label>
            <select
              id="filtro-especialidade"
              className="filtro-select"
              value={filtros.especialidade}
              onChange={(e) => setFiltroEspecialidade(e.target.value)}
              aria-label="Filtrar por especialidade"
            >
              <option value="">Todas as especialidades</option>
              {especialidadesDisponiveis.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </div>

          <div className="filtros-grupo">
            <label htmlFor="filtro-preco" className="filtro-label">
              Preço máximo (R$)
            </label>
            <input
              type="number"
              id="filtro-preco"
              className="filtro-input"
              placeholder="Ex: 200"
              value={filtros.precoMax}
              onChange={(e) => setFiltroPrecoMax(e.target.value)}
              onBlur={(e) => setFiltroPrecoMax(e.target.value)}
              min="0"
              step="0.01"
              aria-label="Filtrar por preço máximo da consulta"
            />
          </div>

          <div className="filtros-grupo">
            <label htmlFor="filtro-modalidade" className="filtro-label">
              Modalidade
            </label>
            <select
              id="filtro-modalidade"
              className="filtro-select"
              value={filtros.modalidade}
              onChange={(e) => setFiltroModalidade(e.target.value)}
              aria-label="Filtrar por modalidade de atendimento"
            >
              <option value="">Todas as modalidades</option>
              <option value="Remota">Online</option>
              <option value="Presencial">Presencial</option>
              <option value="Presencial e Remota">Presencial e Online</option>
            </select>
          </div>

          {Object.values(filtros).some((v) => v) && (
            <div className="filtros-grupo filtro-limpar">
              <button
                type="button"
                className="btn-limpar-filtros"
                onClick={limparFiltros}
                aria-label="Limpar todos os filtros"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <div className="cards-grid" role="list" aria-label="Lista de profissionais">
          {todosProfissionais.length === 0 ? (
            <p className="sem-dados">Nenhum profissional cadastrado ainda.</p>
          ) : (
            profissionaisPagina.map((profissional) => {
              const letra = profissional.nome ? profissional.nome.charAt(0).toUpperCase() : '?';
              // Validação segura do link do Instagram: apenas username alfanumérico + underscore/pontos
              const instagramUsername = profissional.link
                ? profissional.link
                    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
                    .replace('@', '')
                    .split('/')[0]
                    .split('?')[0] // Remover query parameters
                : '';
              const instagramValido =
                instagramUsername && /^[a-zA-Z0-9_.]+$/.test(instagramUsername);
              const classeTag =
                profissional.modalidade === 'Presencial e Remota'
                  ? 'ambas'
                  : profissional.modalidade?.toLowerCase();

              // Formatar especialidades para exibição
              const formatarEspecialidades = (especialidadesStr) => {
                if (!especialidadesStr) return [];
                try {
                  const espArray = JSON.parse(especialidadesStr);
                  return Array.isArray(espArray) ? espArray : [especialidadesStr];
                } catch {
                  return [especialidadesStr];
                }
              };

              const especialidades = formatarEspecialidades(profissional.especialidades);

              return (
                <div className="psi-card" key={profissional.id} role="listitem">
                  <div className="psi-avatar" aria-hidden="true">
                    {letra}
                  </div>
                  <div className="psi-info">
                    <div className="psi-header">
                      <h3 className="psi-nome">{profissional.nome}</h3>
                    </div>
                    <span className="psi-crp">CRP: {profissional.crp}</span>
                    <span className={`psi-modalidade tag-${classeTag}`}>
                      {profissional.modalidade}
                    </span>

                    {especialidades.length > 0 && (
                      <div className="psi-especialidades" aria-label="Especialidades">
                        {especialidades.map((esp, idx) => (
                          <span key={idx} className="psi-especialidade-tag">
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}

                    {profissional.preco && (
                      <div
                        className="psi-preco"
                        aria-label={`Preço da consulta: R$ ${profissional.preco.toFixed(2)}`}
                      >
                        <strong>Consulta:</strong> R$ {profissional.preco.toFixed(2)}
                      </div>
                    )}

                    <p className="psi-contato">
                      <strong>E-mail:</strong> {profissional.contato}
                    </p>
                    <p className="psi-contato">
                      <strong>Telefone:</strong> {profissional.numero}
                    </p>
                  </div>
                  {instagramValido && (
                    <a
                      href={`https://instagram.com/${instagramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="psi-btn-insta"
                      aria-label={`Ver Instagram de ${profissional.nome}`}
                    >
                      Ver Instagram
                    </a>
                  )}
                  <button
                    className="psi-btn-agendar"
                    onClick={() => abrirAgendamento(profissional.id)}
                    disabled={agendamentoCarregando}
                    aria-label={`Agendar com ${profissional.nome}`}
                  >
                    Agendar
                  </button>
                </div>
              );
            })
          )}
        </div>

        {totalPaginas > 1 && (
          <nav className="paginacao" aria-label="Paginação de profissionais">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={`pag-btn ${num === paginaAtual ? 'pag-ativa' : ''}`}
                onClick={() => {
                  setPaginaAtual(num);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-current={num === paginaAtual ? 'page' : undefined}
                aria-label={`Página ${num}`}
              >
                {num}
              </button>
            ))}
          </nav>
        )}

        {/* Modal de Agendamento */}
        {agendandoProfissionalId && profissionalAgendando && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-agendamento-titulo"
          >
            <div className="modal-container">
              <div className="modal-header">
                <h2 id="modal-agendamento-titulo">Agendar com {profissionalAgendando.nome}</h2>
                <button
                  className="modal-close"
                  onClick={fecharAgendamento}
                  aria-label="Fechar modal de agendamento"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAgendamentoSubmit} className="modal-body">
                {agendamentoSucesso && (
                  <div className="sucesso-mensagem" role="status" aria-live="polite">
                    {agendamentoSucesso}
                  </div>
                )}
                {agendamentoErro && (
                  <div className="erro-mensagem" role="alert" aria-live="polite">
                    {agendamentoErro}
                  </div>
                )}

                <div className="modal-info">
                  <p>
                    <strong>Profissional:</strong> {profissionalAgendando.nome}
                  </p>
                  <p>
                    <strong>CRP:</strong> {profissionalAgendando.crp}
                  </p>
                  <p>
                    <strong>Modalidade:</strong> {profissionalAgendando.modalidade}
                  </p>
                  <p>
                    <strong>Duração:</strong> 50 minutos
                  </p>
                </div>

                {agendamentoCarregando ? (
                  <div className="campo-modal">
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                      Carregando horários disponíveis...
                    </p>
                  </div>
                ) : horariosDisponiveis.length === 0 ? (
                  <div className="campo-modal">
                    <p style={{ textAlign: 'center', color: '#c6322d', padding: '20px' }}>
                      Nenhum horário disponível para este profissional nos próximos 30 dias.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="campo-modal">
                      <label htmlFor="agendamentoData">Selecione a Data</label>
                      <select
                        id="agendamentoData"
                        name="data"
                        value={agendamentoData}
                        onChange={(e) => {
                          const novaData = e.target.value;
                          setAgendamentoData(novaData);
                          setAgendamentoHora('');
                          setSlotSelecionado(null);
                        }}
                        disabled={agendamentoCarregando}
                        required
                      >
                        <option value="">-- Escolha uma data --</option>
                        {datasDisponiveis.map((data) => (
                          <option key={data} value={data}>
                            {formatarData(data)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {agendamentoData && horariosDoDia.length > 0 && (
                      <div className="campo-modal">
                        <label>Selecione o Horário</label>
                        <div
                          className="horarios-grid"
                          role="listbox"
                          aria-label="Horários disponíveis"
                        >
                          {horariosDoDia.map((slot) => (
                            <button
                              key={slot.dataHora}
                              type="button"
                              role="option"
                              aria-selected={slotSelecionado?.dataHora === slot.dataHora}
                              className={`horario-slot ${slotSelecionado?.dataHora === slot.dataHora ? 'selecionado' : ''}`}
                              onClick={() => handleSlotClick(slot)}
                              disabled={agendamentoCarregando}
                            >
                              {slot.hora}
                            </button>
                          ))}
                        </div>
                        {horariosDoDia.length === 0 && (
                          <p
                            style={{
                              color: '#6b7280',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                              marginTop: '8px',
                            }}
                          >
                            Nenhum horário disponível para esta data
                          </p>
                        )}
                      </div>
                    )}

                    {agendamentoData &&
                      horariosDoDia.length === 0 &&
                      datasDisponiveis.length > 0 && (
                        <div className="campo-modal">
                          <p
                            style={{
                              color: '#6b7280',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                              padding: '10px',
                            }}
                          >
                            Selecione outra data para ver horários disponíveis
                          </p>
                        </div>
                      )}
                  </>
                )}

                <div className="campo-modal">
                  <label htmlFor="agendamentoObservacoes">Observações (opcional)</label>
                  <textarea
                    id="agendamentoObservacoes"
                    name="observacoes"
                    value={agendamentoObservacoes}
                    onChange={(e) => setAgendamentoObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Motivo da consulta, preferências, etc."
                    disabled={agendamentoCarregando}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancelar-modal"
                    onClick={fecharAgendamento}
                    disabled={agendamentoCarregando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-confirmar-modal"
                    disabled={agendamentoCarregando || !agendamentoData || !agendamentoHora}
                  >
                    {agendamentoCarregando ? 'Agendando...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal Minha Agenda */}
      {minhaAgendaAberta && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="minha-agenda-titulo"
        >
          <div className="modal-container modal-container-large">
            <div className="modal-header">
              <h2 id="minha-agenda-titulo">Minha Agenda</h2>
              <button
                className="modal-close"
                onClick={fecharMinhaAgenda}
                aria-label="Fechar minha agenda"
              >
                ×
              </button>
            </div>
            <div className="modal-body minha-agenda-body">
              {agendamentosCarregando ? (
                <div className="agendamentos-loading">
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                    Carregando seus agendamentos...
                  </p>
                </div>
              ) : meusAgendamentos.length === 0 ? (
                <div className="agendamentos-empty">
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                    Você não possui agendamentos no momento.
                  </p>
                  <button
                    className="btn-novo-agendamento"
                    onClick={fecharMinhaAgenda}
                    style={{ marginTop: '16px' }}
                  >
                    Agendar Consulta
                  </button>
                </div>
              ) : (
                <div className="agendamentos-lista">
                  {Object.entries(
                    meusAgendamentos.reduce((acc, ag) => {
                      const data = new Date(ag.dataHora).toISOString().split('T')[0];
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([data, agendamentosDoDia]) => (
                      <div key={data} className="agenda-dia">
                        <div className="agenda-dia-cabecalho">
                          <span className="agenda-dia-data">
                            {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="agenda-dia-qtd">
                            {agendamentosDoDia.length} agendamento(s)
                          </span>
                        </div>
                        <div className="agenda-dia-itens">
                          {agendamentosDoDia
                            .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
                            .map((ag) => (
                              <div
                                key={ag.id}
                                className={`agenda-item status-${ag.status.toLowerCase()}`}
                              >
                                <div className="agenda-item-horario">
                                  {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="agenda-item-info">
                                  <div className="agenda-item-profissional">
                                    {ag.psicologo?.nome || 'Profissional'}
                                  </div>
                                  <div className="agenda-item-detalhes">
                                    <span className="agenda-item-crp">
                                      CRP: {ag.psicologo?.crp || '–'}
                                    </span>
                                    <span className="agenda-item-modalidade">
                                      {ag.psicologo?.modalidade || '–'}
                                    </span>
                                  </div>
                                </div>
                                <div className="agenda-item-status">
                                  <span
                                    className={`status-badge status-${ag.status.toLowerCase()}`}
                                  >
                                    {traduzirStatus(ag.status)}
                                  </span>
                                </div>
                                <div className="agenda-item-acoes">
                                  {['AGENDADO', 'CONFIRMADO'].includes(ag.status) && (
                                    <button
                                      className="btn-cancelar-agendamento"
                                      onClick={() => cancelarMeuAgendamento(ag.id)}
                                      disabled={agendamentosCarregando}
                                      aria-label={`Cancelar agendamento com ${ag.psicologo?.nome}`}
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <TriageChatWidget />
    </div>
  );
}

// Função auxiliar para traduzir status
function traduzirStatus(status) {
  const statusMap = {
    AGENDADO: 'Agendado',
    CONFIRMADO: 'Confirmado',
    CANCELADO_PACIENTE: 'Cancelado por você',
    CANCELADO_PSICOLOGO: 'Cancelado pelo profissional',
    REALIZADO: 'Realizado',
    FALTOU: 'Faltou',
  };
  return statusMap[status] || status;
}

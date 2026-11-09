import { Link } from 'react-router-dom';
import { useHorarios } from '../../hooks/useHorarios';
import '../../styles/login.css';

export default function Horarios() {
  const {
    horarios,
    carregando,
    form,
    setForm,
    formErros,
    setFormErros,
    editForm,
    setEditForm,
    editErros,
    setEditErros,
    handleCreate,
    abrirEdicao,
    handleUpdate,
    handleDelete,
    getDiaLabel,
    getDiaCurto,
    formatarHora,
    DIAS_SEMANA,
    recarregar,
  } = useHorarios();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErros[name]) {
      setFormErros((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (editErros[name]) {
      setEditErros((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const agruparPorDia = (horarios) => {
    const grupos = {};
    horarios.forEach((h) => {
      if (!grupos[h.diaSemana]) grupos[h.diaSemana] = [];
      grupos[h.diaSemana].push(h);
    });
    return grupos;
  };

  const horariosPorDia = agruparPorDia(horarios);

  return (
    <>
      <div className="auth-container-page">
        <Link to="/" className="btn-sair">
          Sair
        </Link>
        <div className="card">
          <section id="telaR" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0 }}>Meus Horários Disponíveis</h2>
              <button
                onClick={recarregar}
                disabled={carregando}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                {carregando ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>

            {/* Formulário de cadastro */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto 30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
              }}
            >
              <h3 style={{ margin: '0 0 15px', textAlign: 'center' }}>Adicionar Novo Horário</h3>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div className="campo" style={{ flex: 1, minWidth: '140px' }}>
                  <label htmlFor="horarioDia">Dia da Semana</label>
                  <select
                    id="horarioDia"
                    name="diaSemana"
                    value={form.diaSemana}
                    onChange={handleChange}
                    aria-invalid={!!formErros.diaSemana}
                    aria-describedby={formErros.diaSemana ? 'erroDiaSemana' : undefined}
                  >
                    <option value="">Selecione...</option>
                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia.valor} value={dia.valor}>
                        {dia.label}
                      </option>
                    ))}
                  </select>
                  {formErros.diaSemana && (
                    <span id="erroDiaSemana" className="erro-campo" role="alert">
                      {formErros.diaSemana}
                    </span>
                  )}
                </div>

                <div className="campo" style={{ flex: 1, minWidth: '120px' }}>
                  <label htmlFor="horarioInicio">Início</label>
                  <input
                    type="time"
                    id="horarioInicio"
                    name="horaInicio"
                    value={form.horaInicio}
                    onChange={handleChange}
                    aria-invalid={!!formErros.horaInicio}
                    aria-describedby={formErros.horaInicio ? 'erroHoraInicio' : undefined}
                  />
                  {formErros.horaInicio && (
                    <span id="erroHoraInicio" className="erro-campo" role="alert">
                      {formErros.horaInicio}
                    </span>
                  )}
                </div>

                <div className="campo" style={{ flex: 1, minWidth: '120px' }}>
                  <label htmlFor="horarioFim">Fim</label>
                  <input
                    type="time"
                    id="horarioFim"
                    name="horaFim"
                    value={form.horaFim}
                    onChange={handleChange}
                    aria-invalid={!!formErros.horaFim}
                    aria-describedby={formErros.horaFim ? 'erroHoraFim' : undefined}
                  />
                  {formErros.horaFim && (
                    <span id="erroHoraFim" className="erro-campo" role="alert">
                      {formErros.horaFim}
                    </span>
                  )}
                </div>
              </div>

              {formErros.submit && (
                <div className="erro-mensagem" role="alert" style={{ textAlign: 'center' }}>
                  {formErros.submit}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={carregando}
                style={{ padding: '12px', marginTop: '10px' }}
              >
                {carregando ? 'Salvando...' : 'Adicionar Horário'}
              </button>
            </div>

            {/* Lista de horários */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              {horarios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>Nenhum horário cadastrado ainda.</p>
                  <p style={{ fontSize: '14px' }}>
                    Use o formulário acima para adicionar seus horários disponíveis.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {DIAS_SEMANA.map((dia) => {
                    const horariosDia = horariosPorDia[dia.valor];
                    if (!horariosDia || horariosDia.length === 0) return null;

                    return (
                      <div
                        key={dia.valor}
                        style={{
                          border: '1px solid #e9ecef',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: '#f1f3f5',
                            padding: '12px 16px',
                            fontWeight: 600,
                            borderBottom: '1px solid #e9ecef',
                          }}
                        >
                          {dia.label}
                        </div>
                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {horariosDia.map((horario) => (
                              <div
                                key={horario.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px',
                                  backgroundColor: '#fff',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '6px',
                                  minWidth: '280px',
                                  flex: 1,
                                }}
                              >
                                <span style={{ fontWeight: 500, minWidth: '100px' }}>
                                  {formatarHora(horario.horaInicio)} -{' '}
                                  {formatarHora(horario.horaFim)}
                                </span>
                                <span
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    backgroundColor: horario.ativo ? '#d4edda' : '#f8d7da',
                                    color: horario.ativo ? '#155724' : '#721c24',
                                  }}
                                >
                                  {horario.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                  <button
                                    onClick={() => abrirEdicao(horario)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      backgroundColor: '#007bff',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                    }}
                                    aria-label={`Editar horário ${formatarHora(horario.horaInicio)}-${formatarHora(horario.horaFim)}`}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(horario.id)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      backgroundColor: '#c6322d',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                    }}
                                    aria-label={`Excluir horário ${formatarHora(horario.horaInicio)}-${formatarHora(horario.horaFim)}`}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal de edição */}
            {editForm && (
              <div
                id="editar"
                style={{
                  marginTop: '30px',
                  padding: '20px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeeba',
                  borderRadius: '8px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>Editar Horário</h3>
                <div
                  style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}
                >
                  <div className="campo" style={{ flex: 1, minWidth: '140px' }}>
                    <label htmlFor="editDia">Dia da Semana</label>
                    <select
                      id="editDia"
                      name="diaSemana"
                      value={editForm.diaSemana}
                      onChange={handleEditChange}
                      aria-invalid={!!editErros.diaSemana}
                    >
                      {DIAS_SEMANA.map((dia) => (
                        <option key={dia.valor} value={dia.valor}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                    {editErros.diaSemana && (
                      <span className="erro-campo" role="alert">
                        {editErros.diaSemana}
                      </span>
                    )}
                  </div>

                  <div className="campo" style={{ flex: 1, minWidth: '120px' }}>
                    <label htmlFor="editInicio">Início</label>
                    <input
                      type="time"
                      id="editInicio"
                      name="horaInicio"
                      value={editForm.horaInicio}
                      onChange={handleEditChange}
                      aria-invalid={!!editErros.horaInicio}
                    />
                    {editErros.horaInicio && (
                      <span className="erro-campo" role="alert">
                        {editErros.horaInicio}
                      </span>
                    )}
                  </div>

                  <div className="campo" style={{ flex: 1, minWidth: '120px' }}>
                    <label htmlFor="editFim">Fim</label>
                    <input
                      type="time"
                      id="editFim"
                      name="horaFim"
                      value={editForm.horaFim}
                      onChange={handleEditChange}
                      aria-invalid={!!editErros.horaFim}
                    />
                    {editErros.horaFim && (
                      <span className="erro-campo" role="alert">
                        {editErros.horaFim}
                      </span>
                    )}
                  </div>

                  <div
                    className="campo"
                    style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'flex-end' }}
                  >
                    <label
                      htmlFor="editAtivo"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <input
                        type="checkbox"
                        id="editAtivo"
                        name="ativo"
                        checked={editForm.ativo}
                        onChange={handleEditChange}
                      />
                      Horário ativo
                    </label>
                  </div>
                </div>

                {editErros.submit && (
                  <div className="erro-mensagem" role="alert" style={{ marginBottom: '15px' }}>
                    {editErros.submit}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleUpdate}
                    disabled={carregando}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      flex: 1,
                      backgroundColor: '#28a745',
                    }}
                  >
                    {carregando ? 'Salvando...' : 'Confirmar Edição'}
                  </button>
                  <button
                    onClick={() => setEditForm(null)}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      backgroundColor: '#c6322d',
                      flex: 1,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

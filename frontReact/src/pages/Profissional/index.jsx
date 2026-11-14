import { Link } from 'react-router-dom';
import { useProfissional } from '../../hooks/useProfissional';
import '../../styles/login.css';

// Opções de especialidades disponíveis
const ESPECIALIDADES_OPCOES = [
  'Ansiedade',
  'Depressão',
  'TDAH',
  'Terapia de Casal',
  'Terapia Familiar',
  'Transtornos Alimentares',
  'TOC',
  'Trauma e PTSD',
  'Luto',
  'Autoconhecimento',
  'Orientação Vocacional',
  'Neuropsicologia',
  'Psicologia Infantil',
  'Psicologia do Esporte',
  'Psicologia Organizacional',
  'Dependência Química',
  'Fobias',
  'Pânico',
  'Estresse',
  'Outras',
];

export default function Profissional() {
  const {
    profissionais,
    form,
    setForm,
    formErros,
    setFormErros,
    editForm,
    setEditForm,
    editErros,
    setEditErros,
    carregando,
    handleCreate,
    abrirEdicao,
    handleUpdate,
    handleDelete,
  } = useProfissional();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpar erro do campo quando o usuário digita
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

  return (
    <>
      <div className="auth-container-page">
        <Link to="/" className="btn-sair">
          Sair
        </Link>
        <div className="card">
          <section id="telaR" style={{ width: '100%' }}>
            <h2 style={{ marginBottom: '30px' }}>Registre-se como profissional na nossa clínica</h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <div className="campo">
                <label htmlFor="profNome">Nome</label>
                <input
                  type="text"
                  id="profNome"
                  name="nome"
                  placeholder="Nome"
                  value={form.nome}
                  onChange={handleChange}
                  aria-invalid={!!formErros.nome}
                  aria-describedby={formErros.nome ? 'erroNome' : undefined}
                />
                {formErros.nome && (
                  <span id="erroNome" className="erro-campo" role="alert">
                    {formErros.nome}
                  </span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="profCrp">CRP</label>
                <input
                  type="text"
                  id="profCrp"
                  name="crp"
                  placeholder="CRP (ex: 06/123456 ou 06123456)"
                  value={form.crp}
                  onChange={handleChange}
                  aria-invalid={!!formErros.crp}
                  aria-describedby={formErros.crp ? 'erroCrp' : undefined}
                />
                {formErros.crp && (
                  <span id="erroCrp" className="erro-campo" role="alert">
                    {formErros.crp}
                  </span>
                )}
              </div>

              <fieldset className="campo">
                <legend>Modalidade de Atendimento</legend>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      name="modPresencial"
                      checked={form.modPresencial}
                      onChange={handleChange}
                    />{' '}
                    Presencial
                  </label>
                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      name="modRemota"
                      checked={form.modRemota}
                      onChange={handleChange}
                    />{' '}
                    Remota
                  </label>
                </div>
                {formErros.modalidade && (
                  <span className="erro-campo" role="alert">
                    {formErros.modalidade}
                  </span>
                )}
              </fieldset>

              <div className="campo">
                <label htmlFor="profLink">Instagram / Site</label>
                <input
                  type="url"
                  id="profLink"
                  name="link"
                  placeholder="https://instagram.com/usuario"
                  value={form.link}
                  onChange={handleChange}
                  aria-invalid={!!formErros.link}
                  aria-describedby={formErros.link ? 'erroLink' : undefined}
                />
                {formErros.link && (
                  <span id="erroLink" className="erro-campo" role="alert">
                    {formErros.link}
                  </span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="profNumero">Telefone</label>
                <input
                  type="tel"
                  id="profNumero"
                  name="numero"
                  placeholder="(81) 99999-9999"
                  value={form.numero}
                  onChange={handleChange}
                  aria-invalid={!!formErros.numero}
                  aria-describedby={formErros.numero ? 'erroNumero' : undefined}
                />
                {formErros.numero && (
                  <span id="erroNumero" className="erro-campo" role="alert">
                    {formErros.numero}
                  </span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="profContato">E-mail de contato</label>
                <input
                  type="email"
                  id="profContato"
                  name="contato"
                  placeholder="contato@email.com"
                  value={form.contato}
                  onChange={handleChange}
                  aria-invalid={!!formErros.contato}
                  aria-describedby={formErros.contato ? 'erroContato' : undefined}
                />
                {formErros.contato && (
                  <span id="erroContato" className="erro-campo" role="alert">
                    {formErros.contato}
                  </span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="profPreco">Preço da Consulta (R$)</label>
                <input
                  type="number"
                  id="profPreco"
                  name="preco"
                  placeholder="Ex: 150.00"
                  step="0.01"
                  min="0.01"
                  value={form.preco}
                  onChange={handleChange}
                  aria-invalid={!!formErros.preco}
                  aria-describedby={formErros.preco ? 'erroPreco' : undefined}
                />
                {formErros.preco && (
                  <span id="erroPreco" className="erro-campo" role="alert">
                    {formErros.preco}
                  </span>
                )}
              </div>

              <fieldset className="campo">
                <legend>Especialidades</legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ESPECIALIDADES_OPCOES.map((esp) => (
                    <label
                      key={esp}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '20px',
                        background: form.especialidades.includes(esp) ? '#0a0b26' : 'white',
                        color: form.especialidades.includes(esp) ? 'white' : '#374151',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        name="especialidades"
                        value={esp}
                        checked={form.especialidades.includes(esp)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((prev) => ({
                              ...prev,
                              especialidades: [...prev.especialidades, esp],
                            }));
                          } else {
                            setForm((prev) => ({
                              ...prev,
                              especialidades: prev.especialidades.filter((e) => e !== esp),
                            }));
                          }
                          // Limpar erro
                          if (formErros.especialidades) {
                            setFormErros((prev) => {
                              const next = { ...prev };
                              delete next.especialidades;
                              return next;
                            });
                          }
                        }}
                      />
                      <span>{esp}</span>
                    </label>
                  ))}
                </div>
                {formErros.especialidades && (
                  <span className="erro-campo" role="alert">
                    {formErros.especialidades}
                  </span>
                )}
              </fieldset>

              {formErros.submit && (
                <div className="erro-mensagem" role="alert">
                  {formErros.submit}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={carregando}
                style={{ padding: '12px', marginTop: '10px' }}
              >
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

            {profissionais.length > 0 && (
              <div
                style={{ width: '100%', overflowX: 'auto', marginTop: '40px', borderRadius: '8px' }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>Nome</th>
                      <th style={{ whiteSpace: 'nowrap' }}>CRP</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Modalidade</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profissionais.map((p) => (
                      <tr key={p.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.nome}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.crp}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.modalidade}</td>
                        <td style={{ display: 'flex', gap: '10px', minWidth: '150px' }}>
                          <button
                            onClick={() => abrirEdicao(p.id)}
                            style={{ flex: 1, padding: '8px' }}
                            aria-label={`Editar ${p.nome}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            style={{ flex: 1, padding: '8px', backgroundColor: '#c6322d' }}
                            aria-label={`Excluir ${p.nome}`}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editForm && (
              <div
                id="editar"
                style={{
                  marginTop: '30px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                <h3>Editar Profissional</h3>
                <div className="campo">
                  <label htmlFor="editNome">Nome</label>
                  <input
                    type="text"
                    id="editNome"
                    name="nome"
                    placeholder="Nome"
                    value={editForm.nome || ''}
                    onChange={handleEditChange}
                    aria-invalid={!!editErros.nome}
                    aria-describedby={editErros.nome ? 'erroEditNome' : undefined}
                  />
                  {editErros.nome && (
                    <span id="erroEditNome" className="erro-campo" role="alert">
                      {editErros.nome}
                    </span>
                  )}
                </div>
                <div className="campo">
                  <label htmlFor="editCrp">CRP</label>
                  <input
                    type="text"
                    id="editCrp"
                    name="crp"
                    placeholder="CRP (ex: 06/123456)"
                    value={editForm.crp || ''}
                    onChange={handleEditChange}
                    aria-invalid={!!editErros.crp}
                    aria-describedby={editErros.crp ? 'erroEditCrp' : undefined}
                  />
                  {editErros.crp && (
                    <span id="erroEditCrp" className="erro-campo" role="alert">
                      {editErros.crp}
                    </span>
                  )}
                </div>
                <div className="campo">
                  <label htmlFor="editLink">Instagram / Site</label>
                  <input
                    type="url"
                    id="editLink"
                    name="link"
                    placeholder="https://instagram.com/usuario"
                    value={editForm.link || ''}
                    onChange={handleEditChange}
                    aria-invalid={!!editErros.link}
                    aria-describedby={editErros.link ? 'erroEditLink' : undefined}
                  />
                  {editErros.link && (
                    <span id="erroEditLink" className="erro-campo" role="alert">
                      {editErros.link}
                    </span>
                  )}
                </div>
                <div className="campo">
                  <label htmlFor="editNumero">Telefone</label>
                  <input
                    type="tel"
                    id="editNumero"
                    name="numero"
                    placeholder="Telefone"
                    value={editForm.numero || ''}
                    onChange={handleEditChange}
                    aria-invalid={!!editErros.numero}
                    aria-describedby={editErros.numero ? 'erroEditNumero' : undefined}
                  />
                  {editErros.numero && (
                    <span id="erroEditNumero" className="erro-campo" role="alert">
                      {editErros.numero}
                    </span>
                  )}
                </div>
                <div className="campo">
                  <label htmlFor="editContato">E-mail de contato</label>
                  <input
                    type="email"
                    id="editContato"
                    name="contato"
                    placeholder="E-mail de contato"
                    value={editForm.contato || ''}
                    onChange={handleEditChange}
                    aria-invalid={!!editErros.contato}
                    aria-describedby={editErros.contato ? 'erroEditContato' : undefined}
                  />
                  {editErros.contato && (
                    <span id="erroEditContato" className="erro-campo" role="alert">
                      {editErros.contato}
                    </span>
                  )}
                </div>

                <div className="campo">
                  <label htmlFor="editPreco">Preço da Consulta (R$)</label>
                  <input
                    type="number"
                    id="editPreco"
                    name="preco"
                    placeholder="Ex: 150.00"
                    step="0.01"
                    min="0.01"
                    value={editForm.preco || ''}
                    onChange={handleEditChange}
                    aria-invalid={!!editErros.preco}
                    aria-describedby={editErros.preco ? 'erroEditPreco' : undefined}
                  />
                  {editErros.preco && (
                    <span id="erroEditPreco" className="erro-campo" role="alert">
                      {editErros.preco}
                    </span>
                  )}
                </div>

                <fieldset className="campo">
                  <legend>Especialidades</legend>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ESPECIALIDADES_OPCOES.map((esp) => (
                      <label
                        key={esp}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '20px',
                          background: editForm.especialidades?.includes(esp) ? '#0a0b26' : 'white',
                          color: editForm.especialidades?.includes(esp) ? 'white' : '#374151',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="checkbox"
                          name="especialidades"
                          value={esp}
                          checked={editForm.especialidades?.includes(esp)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm((prev) => ({
                                ...prev,
                                especialidades: [...(prev.especialidades || []), esp],
                              }));
                            } else {
                              setEditForm((prev) => ({
                                ...prev,
                                especialidades: (prev.especialidades || []).filter((e) => e !== esp),
                              }));
                            }
                            // Limpar erro
                            if (editErros.especialidades) {
                              setEditErros((prev) => {
                                const next = { ...prev };
                                delete next.especialidades;
                                return next;
                              });
                            }
                          }}
                        />
                        <span>{esp}</span>
                      </label>
                    ))}
                  </div>
                  {editErros.especialidades && (
                    <span className="erro-campo" role="alert">
                      {editErros.especialidades}
                    </span>
                  )}
                </fieldset>

                {editErros.submit && (
                  <div className="erro-mensagem" role="alert">
                    {editErros.submit}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleUpdate}
                    disabled={carregando}
                    style={{ padding: '10px', cursor: 'pointer', flex: 1 }}
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

import { Link } from 'react-router-dom';
import { useProfissional } from '../../hooks/useProfissional';
import '../../styles/login.css';

export default function Profissional() {
    const {
        profissionais, form, setForm, formErros, setFormErros, editForm, setEditForm, editErros, setEditErros, carregando,
        handleCreate, abrirEdicao, handleUpdate, handleDelete
    } = useProfissional();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Limpar erro do campo quando o usuário digita
        if (formErros[name]) {
            setFormErros(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
        if (editErros[name]) {
            setEditErros(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    return (
        <>
            <div className="auth-container-page">
                <Link to="/" className="btn-sair">Sair</Link>
                <div className="card">
                    <section id="telaR" style={{ width: '100%' }}>
                        <h2 style={{ marginBottom: '30px' }}>Registre-se como psicólogo na nossa clínica</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
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
                                {formErros.nome && <span id="erroNome" className="erro-campo" role="alert">{formErros.nome}</span>}
                            </div>

                            <div className="campo">
                                <label htmlFor="profCrp">CRP</label>
                                <input
                                    type="number"
                                    id="profCrp"
                                    name="crp"
                                    placeholder="CRP (ex: 0612345)"
                                    value={form.crp}
                                    onChange={handleChange}
                                    aria-invalid={!!formErros.crp}
                                    aria-describedby={formErros.crp ? 'erroCrp' : undefined}
                                />
                                {formErros.crp && <span id="erroCrp" className="erro-campo" role="alert">{formErros.crp}</span>}
                            </div>

                            <fieldset className="campo">
                                <legend>Modalidade de Atendimento</legend>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="modPresencial"
                                            checked={form.modPresencial}
                                            onChange={handleChange}
                                        /> Presencial
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="modRemota"
                                            checked={form.modRemota}
                                            onChange={handleChange}
                                        /> Remota
                                    </label>
                                </div>
                                {formErros.modalidade && <span className="erro-campo" role="alert">{formErros.modalidade}</span>}
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
                                {formErros.link && <span id="erroLink" className="erro-campo" role="alert">{formErros.link}</span>}
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
                                {formErros.numero && <span id="erroNumero" className="erro-campo" role="alert">{formErros.numero}</span>}
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
                                {formErros.contato && <span id="erroContato" className="erro-campo" role="alert">{formErros.contato}</span>}
                            </div>

                            {formErros.submit && <div className="erro-mensagem" role="alert">{formErros.submit}</div>}

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
                            <div style={{ width: '100%', overflowX: 'auto', marginTop: '40px', borderRadius: '8px' }}>
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
                                        {profissionais.map(p => (
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
                            <div id="editar" style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
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
                                    {editErros.nome && <span id="erroEditNome" className="erro-campo" role="alert">{editErros.nome}</span>}
                                </div>
                                <div className="campo">
                                    <label htmlFor="editCrp">CRP</label>
                                    <input
                                        type="number"
                                        id="editCrp"
                                        name="crp"
                                        placeholder="CRP"
                                        value={editForm.crp || ''}
                                        onChange={handleEditChange}
                                        aria-invalid={!!editErros.crp}
                                        aria-describedby={editErros.crp ? 'erroEditCrp' : undefined}
                                    />
                                    {editErros.crp && <span id="erroEditCrp" className="erro-campo" role="alert">{editErros.crp}</span>}
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
                                    {editErros.link && <span id="erroEditLink" className="erro-campo" role="alert">{editErros.link}</span>}
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
                                    {editErros.numero && <span id="erroEditNumero" className="erro-campo" role="alert">{editErros.numero}</span>}
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
                                    {editErros.contato && <span id="erroEditContato" className="erro-campo" role="alert">{editErros.contato}</span>}
                                </div>
                                {editErros.submit && <div className="erro-mensagem" role="alert">{editErros.submit}</div>}
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
                                        style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#c6322d', flex: 1 }}
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
import React from 'react';
import { usePainel } from '../../hooks/usePainel';
import '../../styles/painel.css';

export default function Painel() {
    const {
        pacienteLogado, sidebarAberta, modoEdicao, paginaAtual, setPaginaAtual,
        editForm, setEditForm, formatarData, toggleSidebar, toggleEdicao,
        salvarEdicao, sair, psicologosPagina, totalPaginas, todosPsicologos
    } = usePainel();

    if (!pacienteLogado) return <div>Carregando...</div>;

    return (
        <div className="painel-wrapper">
            <aside className={`sidebar ${sidebarAberta ? '' : 'sidebar-fechada'}`} id="sidebar">
                <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Recolher painel">&#9776;</button>

                <div className="sidebar-conteudo" style={{ display: sidebarAberta ? 'block' : 'none' }}>
                    <div className="avatar">{pacienteLogado.nome.charAt(0).toUpperCase()}</div>
                    <h2 className="sidebar-nome">{pacienteLogado.nome}</h2>
                    <span className="sidebar-tag">Paciente Mentis</span>

                    <hr className="sidebar-divider" />

                    <div className="info-item">
                        <span className="info-label">E-MAIL</span>
                        <span className="info-valor">{pacienteLogado.email}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">TELEFONE</span>
                        <span className="info-valor">{pacienteLogado.telefone}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">NASCIMENTO</span>
                        <span className="info-valor">{formatarData(pacienteLogado.data)}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">CIDADE / ESTADO</span>
                        <span className="info-valor">{pacienteLogado.cidade} / {pacienteLogado.estado}</span>
                    </div>

                    <hr className="sidebar-divider" />

                    <button className="btn-editar" onClick={toggleEdicao}>Editar Perfil</button>

                    {modoEdicao && (
                        <div id="formEditar" style={{ marginTop: '14px' }}>
                            <div className="campo-edit">
                                <label>Nome</label>
                                <input type="text" value={editForm.nome} onChange={(e) => setEditForm({...editForm, nome: e.target.value})} />
                            </div>
                            <div className="campo-edit">
                                <label>Telefone</label>
                                <input type="tel" value={editForm.telefone} onChange={(e) => setEditForm({...editForm, telefone: e.target.value})} />
                            </div>
                            <div className="campo-edit">
                                <label>Cidade</label>
                                <input type="text" value={editForm.cidade} onChange={(e) => setEditForm({...editForm, cidade: e.target.value})} />
                            </div>
                            <div className="campo-edit">
                                <label>Estado</label>
                                <select value={editForm.estado} onChange={(e) => setEditForm({...editForm, estado: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    <option>AC</option><option>AL</option><option>PE</option><option>SP</option>
                                </select>
                            </div>
                            <button className="btn-salvar-edit" onClick={salvarEdicao}>Salvar</button>
                            <button className="btn-cancelar-edit" onClick={toggleEdicao}>Cancelar</button>
                        </div>
                    )}

                    <button className="btn-sair-painel" onClick={sair}>Sair</button>
                </div>
            </aside>

            <main className="painel-main">
                <div className="painel-header">
                    <h1>Profissionais Disponíveis</h1>
                    <p>Encontre o psicólogo ideal para o seu atendimento em nossa rede de parceiros.</p>
                </div>

                <div className="cards-grid">
                    {todosPsicologos.length === 0 ? (
                        <p className="sem-dados">Nenhum profissional cadastrado ainda.</p>
                    ) : (
                        psicologosPagina.map(p => {
                            const letra = p.nome ? p.nome.charAt(0).toUpperCase() : '?';
                            const linkInsta = p.link ? p.link.replace('@', '') : '';
                            const classeTag = p.modalidade === 'Presencial e Remota' ? 'ambas' : p.modalidade?.toLowerCase();
                            
                            return (
                                <div className="psi-card" key={p.id}>
                                    <div className="psi-avatar">{letra}</div>
                                    <div className="psi-info">
                                        <h3 className="psi-nome">{p.nome}</h3>
                                        <span className="psi-crp">CRP: {p.crp}</span>
                                        <span className={`psi-modalidade tag-${classeTag}`}>{p.modalidade}</span>
                                        <p className="psi-contato"> {p.contato}</p>
                                        <p className="psi-contato"> {p.numero}</p>
                                    </div>
                                    <a href={`https://instagram.com/${linkInsta}`} target="_blank" rel="noreferrer" className="psi-btn-insta">
                                        Ver Instagram
                                    </a>
                                </div>
                            )
                        })
                    )}
                </div>

                {totalPaginas > 1 && (
                    <div className="paginacao">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                            <button 
                                key={num} 
                                className={`pag-btn ${num === paginaAtual ? 'pag-ativa' : ''}`}
                                onClick={() => {
                                    setPaginaAtual(num);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
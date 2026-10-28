import { usePainel } from '../../hooks/usePainel';
import '../../styles/painel.css';

export default function Painel() {
    const {
        pacienteLogado, sidebarAberta, modoEdicao, paginaAtual, setPaginaAtual,
        editForm, setEditForm, editErro, formatarData, toggleSidebar, toggleEdicao,
        salvarEdicao, sair, psicologosPagina, totalPaginas, todosPsicologos
    } = usePainel();

    if (!pacienteLogado) return <div role="status" aria-live="polite" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Carregando...</div>;

    return (
        <div className="painel-wrapper">
            <aside className={`sidebar ${sidebarAberta ? '' : 'sidebar-fechada'}`} id="sidebar" role="complementary" aria-label="Perfil do paciente">
                <button
                    className="btn-toggle-sidebar"
                    onClick={toggleSidebar}
                    title={sidebarAberta ? "Recolher painel" : "Expandir painel"}
                    aria-expanded={sidebarAberta}
                    aria-controls="sidebar-conteudo"
                >
                    &#9776;
                </button>

                <div className="sidebar-conteudo" id="sidebar-conteudo" style={{ display: sidebarAberta ? 'block' : 'none' }}>
                    <div className="avatar" aria-hidden="true">{pacienteLogado.nome.charAt(0).toUpperCase()}</div>
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

                    <button className="btn-editar" onClick={toggleEdicao} aria-expanded={modoEdicao}>
                        {modoEdicao ? 'Cancelar Edição' : 'Editar Perfil'}
                    </button>

                    {modoEdicao && (
                        <div id="formEditar" style={{ marginTop: '14px' }}>
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
                                    <option value="RJ">RJ</option>
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
                            <button className="btn-salvar-edit" onClick={salvarEdicao}>Salvar</button>
                            <button className="btn-cancelar-edit" onClick={toggleEdicao}>Cancelar</button>
                        </div>
                    )}

                    <button className="btn-sair-painel" onClick={sair}>Sair</button>
                </div>
            </aside>

            <main className="painel-main" role="main">
                <div className="painel-header">
                    <h1>Profissionais Disponíveis</h1>
                    <p>Encontre o psicólogo ideal para o seu atendimento em nossa rede de parceiros.</p>
                </div>

                <div className="cards-grid" role="list" aria-label="Lista de profissionais">
                    {todosPsicologos.length === 0 ? (
                        <p className="sem-dados">Nenhum profissional cadastrado ainda.</p>
                    ) : (
                        psicologosPagina.map(p => {
                            const letra = p.nome ? p.nome.charAt(0).toUpperCase() : '?';
                            const linkInsta = p.link ? p.link.replace('@', '') : '';
                            const classeTag = p.modalidade === 'Presencial e Remota' ? 'ambas' : p.modalidade?.toLowerCase();

                            return (
                                <div className="psi-card" key={p.id} role="listitem">
                                    <div className="psi-avatar" aria-hidden="true">{letra}</div>
                                    <div className="psi-info">
                                        <h3 className="psi-nome">{p.nome}</h3>
                                        <span className="psi-crp">CRP: {p.crp}</span>
                                        <span className={`psi-modalidade tag-${classeTag}`}>{p.modalidade}</span>
                                        <p className="psi-contato"> {p.contato}</p>
                                        <p className="psi-contato"> {p.numero}</p>
                                    </div>
                                    {p.link && (
                                        <a
                                            href={`https://instagram.com/${linkInsta}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="psi-btn-insta"
                                            aria-label={`Ver Instagram de ${p.nome}`}
                                        >
                                            Ver Instagram
                                        </a>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                {totalPaginas > 1 && (
                    <nav className="paginacao" aria-label="Paginação de profissionais">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
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
            </main>
        </div>
    );
}
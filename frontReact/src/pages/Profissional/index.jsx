import React from 'react';
import { Link } from 'react-router-dom';
import { useProfissional } from '../../hooks/useProfissional';
import '../../styles/login.css';

export default function Profissional() {
    const {
        profissionais, form, setForm, editForm, setEditForm,
        handleCreate, abrirEdicao, handleUpdate, handleDelete
    } = useProfissional();

    return (
        <>  
        <div className="auth-container-page"> 
            <Link to="/" className="btn-sair">Sair</Link>
            <div className="card">
                <section id="telaR" style={{width: '100%'}}>
                    <h2 style={{marginBottom: '30px'}}>Registre-se como psicólogo na nossa clínica</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', margin: '0 auto'}}>
                        <input
                            type="text"
                            placeholder="Nome"
                            value={form.nome}
                            onChange={(e) => setForm({...form, nome: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="CRP (ex: 06/12345)"
                            value={form.crp}
                            onChange={(e) => setForm({...form, crp: e.target.value})}
                        />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={form.modPresencial}
                                onChange={(e) => setForm({...form, modPresencial: e.target.checked})}
                            /> Presencial
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={form.modRemota}
                                onChange={(e) => setForm({...form, modRemota: e.target.checked})}
                            /> Remota
                        </label>
                        </div>
                        <input
                            type="text"
                            placeholder="Instagram (ex: @usuario)"
                            value={form.link}
                            onChange={(e) => setForm({...form, link: e.target.value})}
                        />
                        <input
                            type="tel"
                            placeholder="Número de telefone"
                            value={form.numero}
                            onChange={(e) => setForm({...form, numero: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="E-mail de contato"
                            value={form.contato}
                            onChange={(e) => setForm({...form, contato: e.target.value})}
                        />
                        <button type="button" onClick={handleCreate}>Salvar</button>
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
                                                <button onClick={() => abrirEdicao(p.id)} style={{ flex: 1, padding: '8px' }}>Editar</button>
                                                <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '8px', backgroundColor: '#c6322d' }}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {editForm && (
                        <div id="editar" style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                            <input
                                type="text"
                                placeholder="Nome"
                                value={editForm.nome || ''}
                                onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                            />
                            <input
                                type="text"
                                placeholder="CRP"
                                value={editForm.crp || ''}
                                onChange={(e) => setEditForm({...editForm, crp: e.target.value})}
                            />
                            <input
                                type="text"
                                placeholder="Instagram"
                                value={editForm.link || ''}
                                onChange={(e) => setEditForm({...editForm, link: e.target.value})}
                            />
                            <input
                                type="tel"
                                placeholder="Número"
                                value={editForm.numero || ''}
                                onChange={(e) => setEditForm({...editForm, numero: e.target.value})}
                            />
                            <input
                                type="text"
                                placeholder="Contato"
                                value={editForm.contato || ''}
                                onChange={(e) => setEditForm({...editForm, contato: e.target.value})}
                            />
                            <button onClick={handleUpdate} style={{ padding: '10px', cursor: 'pointer' }}>Confirmar Edição</button>
                            <button onClick={() => setEditForm(null)} style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#c6322d' }}>Cancelar</button>
                        </div>
                    )}
                </section>
            </div>
        </div>
        </>
    );
}
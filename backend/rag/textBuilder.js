/**
 * Constrói o texto para embedding do psicólogo usando campos JÁ EXISTENTES no model Psicologo.
 * Não requer campo 'descrição' dedicado - compõe a partir de: bio, especialidades, abordagem, preco, modalidade, crp, usuario.nome
 */

import { logger } from '../utils/logger.js';

/**
 * Formata a abordagem do enum para texto legível
 */
function formatAbordagem(abordagem) {
  const mapa = {
    'COGNITIVO_COMPORTAMENTAL': 'Cognitivo-Comportamental (TCC)',
    'PSICANALITICA': 'Psicanalítica',
    'HUMANISTA': 'Humanista',
    'SISTEMICA': 'Sistêmica',
    'GESTALT': 'Gestalt',
    'JUNGUIANA': 'Junguiana',
    'OUTRA': 'Outra abordagem',
  };
  return mapa[abordagem] || abordagem;
}

/**
 * Formata a modalidade do enum para texto legível
 */
function formatModalidade(modalidade) {
  const mapa = {
    'ONLINE': 'Online',
    'PRESENCIAL': 'Presencial',
    'HIBRIDO': 'Híbrido (Online e Presencial)',
  };
  return mapa[modalidade] || modalidade;
}

/**
 * Parseia especialidades do JSON stringificado
 */
function parseEspecialidades(especialidadesString) {
  try {
    const parsed = JSON.parse(especialidadesString);
    if (Array.isArray(parsed)) {
      return parsed.filter(s => s && typeof s === 'string').join(', ');
    }
    return '';
  } catch {
    // Se não for JSON válido, trata como string simples
    return String(especialidadesString || '');
  }
}

/**
 * Constrói o texto rico para embedding do psicólogo
 * @param {Object} psicologo - Objeto do psicólogo com include: { usuario: true }
 * @returns {string} Texto formatado para embedding
 */
export function buildPsychologistText(psicologo) {
  if (!psicologo) {
    logger.warn('buildPsychologistText: psicologo é null/undefined');
    return '';
  }

  const parts = [];

  // Nome e CRP
  const nome = psicologo.usuario?.nome || psicologo.usuario?.email || 'Profissional';
  const crp = psicologo.crp || 'CRP não informado';
  parts.push(`${nome} (${crp})`);

  // Abordagem
  if (psicologo.abordagem) {
    parts.push(`Abordagem: ${formatAbordagem(psicologo.abordagem)}`);
  }

  // Especialidades
  const especialidadesTexto = parseEspecialidades(psicologo.especialidades);
  if (especialidadesTexto) {
    parts.push(`Especialidades: ${especialidadesTexto}`);
  }

  // Modalidade
  if (psicologo.modalidade) {
    parts.push(`Modalidade: ${formatModalidade(psicologo.modalidade)}`);
  }

  // Preço
  if (psicologo.preco !== undefined && psicologo.preco !== null) {
    parts.push(`Preço: R$ ${Number(psicologo.preco).toFixed(2)}/sessão`);
  }

  // Bio
  if (psicologo.bio && psicologo.bio.trim()) {
    parts.push(`Bio: ${psicologo.bio.trim()}`);
  }

  const textoFinal = parts.join('. ') + '.';

  logger.debug('Texto construído para embedding', {
    psicologoId: psicologo.id,
    textoLength: textoFinal.length
  });

  return textoFinal;
}

/**
 * Extrai metadados estruturados do psicólogo para armazenar no vector store
 * @param {Object} psicologo - Objeto do psicólogo
 * @returns {Object} Metadados para o vector store
 */
export function buildPsychologistMetadata(psicologo) {
  if (!psicologo) return {};

  const especialidades = parseEspecialidades(psicologo.especialidades)
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

  return {
    profissionalId: psicologo.id,
    usuarioId: psicologo.usuarioId,
    nome: psicologo.usuario?.nome || psicologo.usuario?.email || 'Profissional',
    crp: psicologo.crp,
    abordagem: psicologo.abordagem,
    especialidades: especialidades,
    modalidade: psicologo.modalidade,
    preco: psicologo.preco ? Number(psicologo.preco) : null,
    validado: psicologo.validado,
    source: 'profissional_profile',
    version: 1,
  };
}

export default {
  buildPsychologistText,
  buildPsychologistMetadata,
  formatAbordagem,
  formatModalidade,
  parseEspecialidades,
};
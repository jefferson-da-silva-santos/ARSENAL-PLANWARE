'use strict';

const VALID_SEXO = ['M', 'F', 'O'];
const VALID_PERFIL = ['admin', 'profissional', 'recepcionista'];
const VALID_STATUS_AGEND = ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'FINALIZADO', 'CANCELADO', 'FALTOU'];
const VALID_STATUS_ATEND = ['EM_ATENDIMENTO', 'FINALIZADO', 'CANCELADO'];

function limparCpf(cpf) {
  return (cpf || '').replace(/\D/g, '');
}

function validarCpf(cpf) {
  const limpo = limparCpf(cpf);
  return limpo.length === 11;
}

function validatePaciente({ nome, cpf }) {
  if (!nome?.trim()) return 'Nome é obrigatório';
  if (!cpf) return 'CPF é obrigatório';
  if (!validarCpf(cpf)) return 'CPF inválido — deve ter 11 dígitos';
  return null;
}

function validateAgendamento({ paciente_id, profissional_id, data_hora, tipo }) {
  if (!paciente_id) return 'paciente_id é obrigatório';
  if (!profissional_id) return 'profissional_id é obrigatório';
  if (!data_hora) return 'data_hora é obrigatório';
  if (!tipo?.trim()) return 'tipo é obrigatório';
  return null;
}

function validateAtendimento({ paciente_id, profissional_id, tipo, motivo }) {
  if (!paciente_id) return 'paciente_id é obrigatório';
  if (!profissional_id) return 'profissional_id é obrigatório';
  if (!tipo?.trim()) return 'tipo é obrigatório';
  if (!motivo?.trim()) return 'motivo é obrigatório';
  return null;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

module.exports = {
  VALID_SEXO, VALID_PERFIL,
  VALID_STATUS_AGEND, VALID_STATUS_ATEND,
  ALLOWED_MIME_TYPES,
  limparCpf, validarCpf,
  validatePaciente, validateAgendamento, validateAtendimento,
};
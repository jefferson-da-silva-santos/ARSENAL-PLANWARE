'use strict';

// Formata cliente para resposta (snake_case)
function formatClient(client) {
  if (!client) return null;
  return {
    id:           client.id,
    nome:         client.nome,
    telefone:     client.telefone     ?? null,
    email:        client.email        ?? null,
    endereco:     client.endereco     ?? null,
    observacoes:  client.observacoes  ?? null,
    criado_em:    client.criadoEm,
    atualizado_em: client.atualizadoEm,
    // Inclui atendimentos formatados se vierem no include
    atendimentos: client.atendimentos
      ? client.atendimentos.map(a => ({
          id:        a.id,
          descricao: a.descricao,
          // FIX: converte Date para string ISO para o frontend parsear corretamente
          data:      a.data instanceof Date ? a.data.toISOString().replace('T', ' ').slice(0, 16) : a.data,
          criado_em: a.criadoEm,
        }))
      : undefined,
  };
}

function formatSchedule(schedule) {
  if (!schedule) return null;
  return {
    id:           schedule.id,
    cliente_id:   schedule.clientId    ?? null,
    cliente_nome: schedule.client?.nome ?? null,
    titulo:       schedule.titulo,
    // FIX: garante que dataHora é serializado como string legível pelo frontend
    data_hora:    schedule.dataHora instanceof Date
      ? schedule.dataHora.toISOString().replace('T', ' ').slice(0, 16)
      : schedule.dataHora,
    duracao_min:  schedule.duracaoMin,
    status:       schedule.status?.toLowerCase(),
    notas:        schedule.notas       ?? null,
    criado_em:    schedule.criadoEm,
  };
}

function formatContact(contact) {
  if (!contact) return null;
  return {
    id:           contact.id,
    nome:         contact.nome,
    empresa:      contact.empresa      ?? null,
    telefone:     contact.telefone     ?? null,
    email:        contact.email        ?? null,
    cargo:        contact.cargo        ?? null,
    status_lead:  contact.statusLead?.toLowerCase(),
    observacoes:  contact.observacoes  ?? null,
    criado_em:    contact.criadoEm,
    interacoes:   contact.interacoes
      ? contact.interacoes.map(i => ({
          id:        i.id,
          tipo:      i.tipo?.toLowerCase(),
          descricao: i.descricao,
          data:      i.data instanceof Date ? i.data.toISOString().replace('T', ' ').slice(0, 16) : i.data,
          criado_em: i.criadoEm,
        }))
      : undefined,
  };
}

function formatReminder(reminder) {
  if (!reminder) return null;
  return {
    id:        reminder.id,
    titulo:    reminder.titulo,
    descricao: reminder.descricao  ?? null,
    // FIX: serializa Date corretamente
    data_hora: reminder.dataHora instanceof Date
      ? reminder.dataHora.toISOString().replace('T', ' ').slice(0, 16)
      : reminder.dataHora,
    tipo:      reminder.tipo?.toLowerCase(),
    ref_id:    reminder.refId      ?? null,
    concluido: reminder.concluido,
    criado_em: reminder.criadoEm,
  };
}

// Formata atendimento avulso (usado no dashboard)
function formatAttendance(attendance) {
  if (!attendance) return null;
  return {
    id:           attendance.id,
    cliente_nome: attendance.client?.nome ?? null,
    descricao:    attendance.descricao,
    data:         attendance.data instanceof Date
      ? attendance.data.toISOString().replace('T', ' ').slice(0, 16)
      : attendance.data,
    criado_em:    attendance.criadoEm,
  };
}

module.exports = { formatClient, formatSchedule, formatContact, formatReminder, formatAttendance };
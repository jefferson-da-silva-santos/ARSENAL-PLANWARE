'use strict';

const repo = require('./ClinicaRepository');
const CreatePacienteService = require('./services/CreatePacienteService');
const UpdatePacienteService = require('./services/UpdatePacienteService');
const DeletePacienteService = require('./services/DeletePacienteService');
const CreateAgendamentoService = require('./services/CreateAgendamentoService');
const UpdateAgendamentoService = require('./services/UpdateAgendamentoService');
const CreateAtendimentoService = require('./services/CreateAtendimentoService');
const UpdateAtendimentoService = require('./services/UpdateAtendimentoService');
const { execute: uploadAnexo } = require('./services/UploadAnexoService');
const DeleteAnexoService = require('./services/DeleteAnexoService');
const GetDashboardService = require('./services/GetDashboardService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'CLINICA';

function getUser(req) {
  return { id: req.user.id, nome: req.user.name || 'Sistema' };
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const data = await GetDashboardService.execute(req.user.tenantId);
    return res.json({ sucesso: true, dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Pacientes ─────────────────────────────────────────────────

async function listPacientes(req, res) {
  try {
    const data = await repo.findAllPacientes(req.user.tenantId, req.query);
    return res.json({ sucesso: true, dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function getPaciente(req, res) {
  try {
    const pac = await repo.findPacienteById(req.user.tenantId, req.params.id);
    if (!pac) return res.status(404).json({ sucesso: false, mensagem: 'Paciente não encontrado' });
    return res.json({ sucesso: true, dados: repo.formatPaciente(pac) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function createPaciente(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await CreatePacienteService.execute(req.user.tenantId, id, nome, req.body);
    return res.status(201).json({ sucesso: true, mensagem: 'Paciente cadastrado', dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function updatePaciente(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await UpdatePacienteService.execute(req.user.tenantId, req.params.id, id, nome, req.body);
    return res.json({ sucesso: true, mensagem: 'Paciente atualizado', dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function deletePaciente(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await DeletePacienteService.execute(req.user.tenantId, req.params.id, id, nome);
    return res.json({ sucesso: true, mensagem: 'Paciente removido', dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Agendamentos ──────────────────────────────────────────────

async function listAgendamentos(req, res) {
  try {
    const agendamentos = await repo.findAllAgendamentos(req.user.tenantId, req.query);
    return res.json({ sucesso: true, dados: agendamentos.map(repo.formatAgendamento) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function createAgendamento(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await CreateAgendamentoService.execute(req.user.tenantId, id, nome, req.body);
    return res.status(201).json({ sucesso: true, mensagem: 'Agendamento criado', dados: { id: data.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function updateAgendamento(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await UpdateAgendamentoService.execute(req.user.tenantId, req.params.id, id, nome, req.body);
    return res.json({ sucesso: true, mensagem: 'Agendamento atualizado', dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function cancelarAgendamento(req, res) {
  try {
    const { id, nome } = getUser(req);
    await repo.cancelarAgendamento(req.user.tenantId, req.params.id);
    await repo.registrarLog(req.user.tenantId, {
      usuarioId: id, usuarioNome: nome,
      acao: 'CANCELAMENTO', entidade: 'agendamentos', entidadeId: req.params.id,
    });
    return res.json({ sucesso: true, mensagem: 'Agendamento cancelado' });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Atendimentos ──────────────────────────────────────────────

async function listAtendimentos(req, res) {
  try {
    const atendimentos = await repo.findAllAtendimentos(req.user.tenantId, req.query);
    return res.json({ sucesso: true, dados: atendimentos.map(repo.formatAtendimento) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function getAtendimento(req, res) {
  try {
    const at = await repo.findAtendimentoById(req.user.tenantId, req.params.id);
    if (!at) return res.status(404).json({ sucesso: false, mensagem: 'Atendimento não encontrado' });
    return res.json({ sucesso: true, dados: repo.formatAtendimento(at) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function createAtendimento(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await CreateAtendimentoService.execute(req.user.tenantId, id, nome, req.body);
    return res.status(201).json({ sucesso: true, mensagem: 'Atendimento registrado', dados: { id: data.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function updateAtendimento(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await UpdateAtendimentoService.execute(req.user.tenantId, req.params.id, id, nome, req.body);
    return res.json({ sucesso: true, mensagem: 'Atendimento atualizado', dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function cancelarAtendimento(req, res) {
  try {
    const { id, nome } = getUser(req);
    await repo.cancelarAtendimento(req.user.tenantId, req.params.id);
    await repo.registrarLog(req.user.tenantId, {
      usuarioId: id, usuarioNome: nome,
      acao: 'EXCLUSAO', entidade: 'atendimentos', entidadeId: req.params.id,
    });
    return res.json({ sucesso: true, mensagem: 'Atendimento cancelado' });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Anexos ────────────────────────────────────────────────────

async function uploadAnexos(req, res) {
  try {
    const { id, nome } = getUser(req);
    const dados = await uploadAnexo(req.params.id, req.files, req.body.descricao, id, nome, req.user.tenantId);
    return res.status(201).json({ sucesso: true, mensagem: 'Arquivos anexados', dados });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function deleteAnexo(req, res) {
  try {
    const { id, nome } = getUser(req);
    const data = await DeleteAnexoService.execute(req.params.id, id, nome, req.user.tenantId);
    return res.json({ sucesso: true, mensagem: 'Anexo removido', dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Alertas ───────────────────────────────────────────────────

async function listAlertas(req, res) {
  try {
    const data = await repo.findAlertasByUsuario(req.user.tenantId, req.user.id);
    return res.json({ sucesso: true, dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function marcarAlertaLido(req, res) {
  try {
    await repo.marcarAlertaLido(req.user.tenantId, req.params.id);
    return res.json({ sucesso: true, mensagem: 'Marcado como lido' });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

async function marcarTodosLidos(req, res) {
  try {
    await repo.marcarTodosLidos(req.user.tenantId, req.user.id);
    return res.json({ sucesso: true, mensagem: 'Todos marcados como lidos' });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Logs ──────────────────────────────────────────────────────

async function listLogs(req, res) {
  try {
    const data = await repo.findLogs(req.user.tenantId, req.query);
    return res.json({ sucesso: true, dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

// ── Busca global ──────────────────────────────────────────────

async function busca(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ sucesso: true, dados: { pacientes: [], atendimentos: [] } });
    const data = await repo.buscaGlobal(req.user.tenantId, q);
    return res.json({ sucesso: true, dados: data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ sucesso: false, mensagem: err.message });
  }
}

module.exports = {
  getDashboard,
  listPacientes, getPaciente, createPaciente, updatePaciente, deletePaciente,
  listAgendamentos, createAgendamento, updateAgendamento, cancelarAgendamento,
  listAtendimentos, getAtendimento, createAtendimento, updateAtendimento, cancelarAtendimento,
  uploadAnexos, deleteAnexo,
  listAlertas, marcarAlertaLido, marcarTodosLidos,
  listLogs,
  busca,
};
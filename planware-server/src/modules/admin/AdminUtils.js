'use strict';

const VALID_SYSTEMS = ['CLIENTPRO', 'STOCKPRO', 'FINVAULT', 'FINFLOW', 'FINANCEFLOW', 'KANBAN', 'CLINICA', 'ORDEMTECH', 'FIADO'];
const VALID_ROLES = ['USER', 'SUPERADMIN'];

// Gera slug a partir do nome do tenant
// Ex: "Minha Empresa Ltda" → "minha-empresa-ltda"
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Valida se um array de sistemas é válido
// Aceita: ['CLIENTPRO', 'STOCKPRO'] etc.
function validateSystems(systems) {
  if (!Array.isArray(systems) || systems.length === 0) {
    return 'permissions deve ser um array não vazio';
  }
  const invalid = systems.filter((s) => !VALID_SYSTEMS.includes(s));
  if (invalid.length > 0) {
    return `Sistemas inválidos: ${invalid.join(', ')}. Válidos: ${VALID_SYSTEMS.join(', ')}`;
  }
  return null;
}

function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    return `Role inválida. Válidas: ${VALID_ROLES.join(', ')}`;
  }
  return null;
}

module.exports = { slugify, validateSystems, validateRole, VALID_SYSTEMS };
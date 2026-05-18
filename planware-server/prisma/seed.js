'use strict';

// ─────────────────────────────────────────────────────────────
//  Seed — bootstrap do PlanwareServer
//
//  Cria o tenant "Planware" e o primeiro usuário SUPERADMIN.
//  Execute uma única vez após a primeira migration:
//
//    node prisma/seed.js
//
//  As credenciais abaixo são apenas para o primeiro acesso.
//  Altere a senha imediatamente via /admin após o login.
// ─────────────────────────────────────────────────────────────

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // Tenant raiz da Planware
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'planware' },
    update: {},
    create: {
      name: 'Planware',
      slug: 'planware',
      active: true,
    },
  });

  console.log(`✅ Tenant criado: ${tenant.name} (${tenant.id})`);

  const email = 'admin@planware.com';
  const plainPassword = 'planware@2025';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const superadmin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Superadmin',
      email,
      passwordHash,
      role: 'SUPERADMIN',
      active: true,
    },
  });

  console.log(`✅ Superadmin criado: ${superadmin.email}`);
  console.log(`\n─────────────────────────────────────`);
  console.log(`  Email : ${email}`);
  console.log(`  Senha : ${plainPassword}`);
  console.log(`─────────────────────────────────────`);
  console.log(`\n⚠️  Altere a senha após o primeiro login.\n`);
}

main()
  .catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
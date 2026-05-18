'use strict';

const { PrismaClient } = require('@prisma/client');

// Singleton — evita múltiplas conexões em desenvolvimento com hot-reload
const prisma = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
});

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

module.exports = prisma;
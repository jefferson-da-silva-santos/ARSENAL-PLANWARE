'use strict';

const LoginService = require('./services/LoginService');
const RegisterService = require('./services/RegisterService');
const RefreshTokenService = require('./services/RefreshTokenService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'AUTH';

async function login(req, res) {
  try {
    const result = await LoginService.execute(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function register(req, res) {
  try {
    const result = await RegisterService.execute(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function refresh(req, res) {
  try {
    const result = await RefreshTokenService.execute(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function me(req, res) {
  return res.status(200).json({ success: true, data: req.user });
}

module.exports = { login, register, refresh, me };
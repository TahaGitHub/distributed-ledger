const { SetPort } = require('./src/helper/net-controller');

const BASEDIR = __dirname;

const LOCAL_HOSTIP = require('ip').address(); //'192.168.1.70';
const PUBLIC_HOSTIP = require('public-ip').v4();

const HOSTING_PORT = 50007;
const FLUREEHOSTING_PORT = 31090;
const FLUREECONNECTING_PORT = SetPort(31790, 31799);
const DISCOVERING_PORT = SetPort(39790, 39799);

const CURRENT_NODEDATA_CRYPTO = {
  name: 'PassApp',
  channel: 'peer-passapp-to-node-peer',
  random: Math.ceil(Math.random() * 1000),
};

const CHANNEL = {
  NODE: 'peer-passapp-peer',
};

const FILES = {
  hash: 'hashKey.key',
  pri: 'privateKey.key',
  pub: 'publicKey.key',
  users: 'users.json',
  nodes: 'nodes.json',
};

const DIRECTORIES = {
  FILES: '/_files',
  TEST: '/_test',
  SHARINGFILE: './_shared-files',
  ACTIONS: '/_actions/',
  
  DB: '/db-files',
  CRPTO: '/crypto-files',
}

const MES_ACTION = {
  MESSAGE_STATE: 'MESSAGE_STATE',

  BROADCAST_SET_NODE: 'BROADCAST_SET_NODE',
  BROADCAST_DELETE_NODE: 'BROADCAST_DELETE_NODE',

  BROADCAST_USER: 'BROADCAST_USER',
};

const NODE_TYPES = {
  MAIN_MASTER: 'main-master',
  MASTER: 'master',
  WORKER: 'worker',
};

const FLUREE_DB = {
  NETWORK: 'pass-app-network',
  LEDGER: 'ledger',
  ALL: 'pass-app-network/ledger'
}
const FLUREE_URL = `http://${LOCAL_HOSTIP}:${FLUREEHOSTING_PORT}/fdb/${FLUREE_DB.ALL}/`;

module.exports = {
  BASEDIR,
  NODE_TYPES,

  LOCAL_HOSTIP,
  PUBLIC_HOSTIP,
  
  HOSTING_PORT,
  FLUREEHOSTING_PORT,
  FLUREECONNECTING_PORT,
  DISCOVERING_PORT,

  FILES,
  DIRECTORIES,

  CURRENT_NODEDATA_CRYPTO,
  CHANNEL,
  MES_ACTION,

  FLUREE_DB,
  FLUREE_URL,
};

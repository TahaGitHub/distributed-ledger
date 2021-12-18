const NODES_INSERTUPDATE_NODE = "NODES.INSERTUPDATE_NODE";
const NODES_SYNCNODESFILE = "NODES.SYNCNODESFILE";
const NODES_DELETE_NODE = "NODES.DELETE_NODE";

const insertUpdateNode = (node) => {
  return {
    type: NODES_INSERTUPDATE_NODE,
    node,
  };
};

const syncNodesFile = (nodes) => {
  return {
    type: NODES_SYNCNODESFILE,
    nodes,
  };
};

const deleteNode = (node) => {
  return {
    type: NODES_DELETE_NODE,
    node,
  };
};

module.exports = {
  NODES_INSERTUPDATE_NODE,
  NODES_SYNCNODESFILE,
  NODES_DELETE_NODE,

  insertUpdateNode,
  syncNodesFile,
  deleteNode,
};

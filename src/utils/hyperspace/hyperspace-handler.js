const Node = require("../../units/node");
const { MES_ACTION } = require("../../../config");

const actionsHolder = (message) => {
  switch (message.action) {
    case MES_ACTION.BROADCAST_SET_NODE:
      console.log("Set Node Action");
      Node.syncNodesFile(message.nodes);
      break;

    case MES_ACTION.BROADCAST_DELETE_NODE:
      console.log("Delete Node Action");
      Node.deleteNode(message.node);
      break;

    case MES_ACTION.BROADCAST_USER:
      console.log("User Action");
      break;
    default:
      break;
  }
};

module.exports = {
  actionsHolder,
};

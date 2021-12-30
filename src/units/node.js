const store = require("../store/store");
const nodesAction = require("../store/actions/nodesAction");

const FilesController = require("../helper/files-controller");
const { FILES, NODE_TYPE } = require("../../config");

class Node {
  constructor({
    created_time,
    updated_time,
    nodeHashKey,
    coreKey,
    publicKey,
    remoteSocket,
  }) {
    this.status = "pending";
    this.created_time = created_time;
    this.updated_time = updated_time;
    this.nodeHashKey = nodeHashKey;
    this.coreKey = coreKey;
    this.publicKey = publicKey;
    this.type = NODE_TYPE;
    this.remoteSocket = remoteSocket;
  }

  static async genesisFile() {
    if (FilesController.isExistsFile(FILES.nodes)) {
      return;
    }

    // const node = new Node({
    //   created_time: new Date(),
    //   nodeHashKey: store.getState().keys.hashKey,
    //   coreKey: null,
    //   publicKey: store.getState().keys.publicKey,
    // });

    // store.dispatch(nodesAction.insertUpdateNode());
    FilesController.createSaveFile(FILES.nodes, store.getState().nodes.nodes);
  }

  static insertUpdateNode(node) {
    store.dispatch(nodesAction.insertUpdateNode(node));
  }

  static syncNodesFile(nodes) {
    if (
      JSON.stringify(store.getState().nodes.nodes) === JSON.stringify(nodes)
    ) {
      console.log("The incoming nodes are same");
      return;
    }

    store.dispatch(nodesAction.syncNodesFile(nodes));
  }

  static deleteNode(node) {
    store.dispatch(nodesAction.deleteNode(node));
  }
}

module.exports = Node;

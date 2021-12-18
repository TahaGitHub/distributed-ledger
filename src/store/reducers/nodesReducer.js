const nodesAction = require("../actions/nodesAction");

const { FILES } = require("../../../config");
const FilesController = require("../../helper/files-controller");
const { sortBy_Time } = require("../../helper/sortData-controller");

const initState = {
  nodes: FilesController.isExistsFile(FILES.nodes)
    ? FilesController.loadDataFile(FILES.nodes)
    : {
        modified: false,
        created_time: new Date(),
        updated_time: "",
        modifiers: [],
        count: 0,
        nodes: new Array(),
      },
};

module.exports = (state = initState, action) => {
  switch (action.type) {
    case nodesAction.NODES_INSERTUPDATE_NODE:
      var index = state.nodes.nodes.findIndex(
        (item) => item.nodeHashKey === action.node.nodeHashKey
      );
      if (index === -1) {
        state.nodes.nodes.push(action.node);
      } else {
        state.nodes.nodes[index] = action.node;
        // state.nodes.nodes[index].updated_time = new Date();
      }
      state.nodes.nodes = sortBy_Time(state.nodes.nodes);
      state.nodes.count = state.nodes.nodes.length;

      FilesController.updateDataFile(
        FILES.nodes,
        JSON.stringify(state.nodes, null, 2)
      );
      return {
        ...state,
        nodes: state.nodes,
      };

    case nodesAction.NODES_SYNCNODESFILE:
      action.nodes.forEach((item) => {
        var index = state.nodes.nodes.findIndex(
          (_item) => _item.nodeHashKey === item.nodeHashKey
        );
        // console.log('Index of item ', index);
        if (index === -1) {
          // console.log('Item is not exist ', item);
          state.nodes.nodes.push(item);
        } else {
          // console.log('Item exist ', item);
          state.nodes.nodes[index] = item;
        }
      });

      state.nodes.nodes = sortBy_Time(state.nodes.nodes);
      state.nodes.count = state.nodes.nodes.length;

      FilesController.updateDataFile(
        FILES.nodes,
        JSON.stringify(state.nodes, null, 2)
      );
      return {
        ...state,
        nodes: state.nodes,
      };

    case nodesAction.NODES_DELETE_NODE:
      var filteredNode = state.nodes.nodes.filter(
        (item) => item.coreKey !== action.node
      );

      state.nodes.nodes = sortBy_Time(filteredNode);
      state.nodes.count = state.nodes.nodes.length;

      FilesController.updateDataFile(
        FILES.nodes,
        JSON.stringify(state.nodes, null, 2)
      );
      return {
        ...state,
        nodes: state.nodes,
      };

    default:
      return state;
  }
};

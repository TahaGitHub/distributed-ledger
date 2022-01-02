const store = require("../../store/store");
const nodesAction = require("../../store/actions/nodesAction");

const crypto = require("crypto");

const Hyperswarm = require("hyperswarm");
const Hyperbee = require("hyperbee");
const { Client, Server } = require("hyperspace");

const { CHANNEL, DISCOVERING_PORT, PUBLIC_HOSTIP, LOCAL_HOSTIP, DIRECTORIES, NODE_TYPE, NODE_TYPES } = require("../../../config");
const Node = require("../../units/node");

var _ = require("lodash");
const { logWithColor } = require("../../helper/logs");

const fluree = require('../../services/fluree/fluree');

/*
** Set controller times like:
** - Re-join time on swarm
** - Message sending time after peers finding each other
*/
async function timersIpsPortEquipper() {
  const joiningTimer = Math.floor(
    360000 + Math.random() * (480000 + 1 - 360000) // 10-6 min
  );
  const sendingTimer = Math.floor(4000 + Math.random() * (10000 + 1 - 4000)); // 10-4 sec

  console.log(
    `\nRe-Joining time: ${((joiningTimer % 3600000) / 60000).toFixed(
      2
    )} min\nSending message time: ${parseInt(
      (sendingTimer + "").charAt(0)
    )} sec\nPublic Ip: ${await PUBLIC_HOSTIP}\nPublic Port: ${await DISCOVERING_PORT}\n`
  );

  return { joiningTimer, sendingTimer };
}

/*
** Configure "Server" and "Client" for hayperswarm  
*/
async function setUpHyperspace() {
  let client;
  let server;

  // Create a Client and Server
  // =
  try {
    client = new Client();
    await client.ready();
  } catch (e) {
    // no daemon, start it in-process
    server = new Server({ storage: DIRECTORIES.SHARINGFILE });
    await server.ready();
    client = new Client();
    await client.ready();
  }

  // Create a Hyperbee
  // =
  const current_bee = new Hyperbee(
    client.corestore().get({ name: "nodes-collector" }),
    {
      keyEncoding: "utf8",
      valueEncoding: "json",
    }
  );
  await current_bee.ready();

  const coreKey = current_bee.feed.key.toString("hex");

  return {
    client,
    current_bee,
    coreKey,
    async cleanup() {
      await client.close();
      if (server) {
        console.log("Shutting down Hyperspace, this may take a few seconds...");
        await server.stop();
      }
    },
  };
}

/*
** Configure hapercore and hyperbee
** add current node data to nodes.json file
*/
exports.hyperspace = async function () {
  let peers = {};
  let connSeq = 0;

  let replicated_bees = {};

  const { joiningTimer, sendingTimer } = await timersIpsPortEquipper();
  const { client, current_bee, coreKey, cleanup } = await setUpHyperspace();
  
  async function main() {
    console.log(
      "Hyperspace daemon connected, status:",
      await client.status(),
      "\n"
    );

    // Swarm on the network
    // =
    await client.replicate(current_bee.feed);
    // await new Promise((r) => setTimeout(r, 3e3)); // just a few seconds
    await client.network.configure(current_bee.feed, {
      lookup: true, // find & connect to peers
      announce: true, // optional- announce self as a connection target
    });

    /*
    ** Append action when new data adding to hypercore file
    */
    current_bee.feed.on("append", async () => {
      const index = current_bee.feed.length - 1;
      try {
        const key = await (
          await current_bee.getBlock(index, {
            valueEncoding: "json",
          })
        ).key.toString("utf8");
        
        const value = JSON.parse(
          await (
            await current_bee.getBlock(index, {
              valueEncoding: "json",
            })
          ).value.toString("utf8")
        );
  
        // console.log(key, " ", value);
        console.log(`Append to current core: ${key}`);
        store.dispatch(nodesAction.insertUpdateNode(value.part));
      } catch (error) {
        console.log(error)
      }
    });

    var _currentNode = store.getState().nodes.nodes.nodes.find(
      (item) => item.nodeHashKey === store.getState().keys.hashKey
    );

    // Configure current node data
    var currentNode = new Node({
      created_time: _currentNode ? _currentNode.created_time : new Date(),
      updated_time: _currentNode ? new Date() : null,
      nodeHashKey: store.getState().keys.hashKey,
      coreKey: coreKey,
      publicKey: store.getState().keys.publicKey,
      remoteSocket: {
        disPort: await DISCOVERING_PORT,
        flureePort: _currentNode?.remoteSocket?.flureePort ? _currentNode?.remoteSocket?.flureePort : null,
        localIP: LOCAL_HOSTIP,
        remoteIP: await PUBLIC_HOSTIP,
      },
    });

    // Add current node data to hypercore file
    await current_bee.put(coreKey, {
      type: "node",
      part: currentNode,
    });

    // Check nodes file is exist and has data adding to hypercore file
    var bar = new Promise((resolve, reject) => {
      if (store.getState().nodes.nodes.count === 0) {
        resolve(-1);
      }

      var i = 0;
      store
        .getState()
        .nodes.nodes.nodes.forEach(async (element, index, array) => {
          const vv = await current_bee.get(element.coreKey);
          if (!vv) {
            await current_bee.put(element.coreKey, {
              type: "node",
              part: element,
            });
            i++;
          }
          if (index === array.length - 1) resolve(i);
        });
    });

    bar.then(async (i) => {
      await new Promise((r) => setTimeout(r, 1e3)); // wait just a few seconds
      console.log(
        `\nSyncing nodes file with hypercore file:\n   ${
          i === -1
            ? "No extra nodes found!"
            : `There ${i} node synced with hypercore file`
        }`
      );

      // Start discovering peers
      hyperSwarm();
      fluree.main();
    });

    // await new Promise((r) => setTimeout(r, 3e3)); // wait just a few seconds
    // await cleanup();
  }

  async function hyperSwarm() {
    // Configure hyperswam for discovery DHT protocol & topic channel
    const swarm = Hyperswarm();
    const topic = crypto.createHash("sha256").update(CHANNEL.NODE).digest();

    // Choose a random unused port for listening TCP peer connections
    swarm.listen(await DISCOVERING_PORT);

    logWithColor('green',
      `\nCore id: ${coreKey}\nTopic id: ${topic.toString(
          "hex"
      )} >> Port: ${await DISCOVERING_PORT}\n`);

    // Join current node in DHT protocol by topic key
    await swarm.join(topic, {
      lookup: true, // find & connect to peers
      announce: true, // optional- announce self as a connection target
    });

    const _timer = setInterval(async () => {
      // if (connSeq !== 0) {
      //   console.log("Stop Re-joining the topic");
      //   clearInterval(_timer);
      // } else {
      console.log("Re-joining the topic");
      await swarm.join(topic, {
        lookup: true, // find & connect to peers
        announce: true, // optional- announce self as a connection target
      });
      // }
    }, joiningTimer);

    // store.getState().nodes.nodes.nodes.forEach((element) => {
    //   if (
    //     element.socket &&
    //     element.nodeHashKey !== store.getState().keys.hashKey
    //   ) {
    //     swarm.network.bind(function () {
    //       replicateCore(null, element.coreKey);
    //       // swarm.connect(element.socket, function (err, _socket) {
    //       //   if (err) throw err;
    //       //   _socket.write("Hello World!");
    //       // });
    //     });
    //   }
    //   // swarm.network.discovery.lookupOne(element.coreKey);
    //   // replicateCore(current_bee, { key: element.coreKey, value: element });
    // });

    swarm.on("connection", (socket, info) => {
      const seq = connSeq;
      console.log(`>>> Connection a new peer is a client: ${info.client} <<<`);

      const peerId = !info.peer
        ? !socket?._server
          ? socket.remoteAddress
          : socket._server._connectionKey
        : info.peer["host"] + ":" + info.peer["port"]; //.stream.state.publicKey.toString("hex");

      console.log(
        `Connected new peer, No: ${seq}, Client: ${info.client}, PeerHost: ${peerId}`
      );

      // Keep alive TCP connection with peer
      if (info.initiator) {
        try {
          socket.setKeepAlive(true, 600);
        } catch (exception) {
          console.log("exception", exception);
        }
      }

      socket.on("data", async (message) => {
        console.log(
          `Received Message from peer No: ${seq}, PeerHost: ${peerId} ---->\n${message}`
        );

        try {
          if (typeof message === "object") {
            let _message = JSON.parse(message);
            // if (info.client) {
            replicateCore(_message);
            // }
          } else {
            console.log("Message type is not an Object ", typeof message);
          }
        } catch (error) {
          console.log("Error with receving message ", error);
        }
      });
      socket.on("close", () => {
        console.log(`Connection peer closed, No: ${seq}, PeerHost: ${peerId}`);
        if (peers[peerId]) {
          delete peers[peerId];
        }
      });
      socket.on("error", (err) => console.error("1 CONN ERR:", err));

      if (!peers[peerId]) {
        peers[peerId] = {};
      }

      peers[peerId].seq = seq;
      peers[peerId].socket = socket;

      // if (info.client) {
      //   console.log("client");
      // } else {
      setTimeout(() => {
        SendMessageToPeer(peerId, {
          type: "node",
          key: coreKey,
        });
      }, sendingTimer);
      // }
      connSeq++;
    });
  }

  /*
  ** Replicate and sync new core with current node
  */
  async function replicateCore(message) {
    if (replicated_bees[message.key]) {
      console.log("trying to duple replicate ", replicated_bees);
      return;
    }

    console.log(`Replicating core ${message.key}\n`);

    replicated_bees[message.key] = true;

    const corestore = client.corestore().get({
      key: message.key,
    });
    await client.replicate(corestore);

    let _bee = new Hyperbee(corestore, {
      keyEncoding: "utf8",
      valueEncoding: "json",
    });
    await _bee.ready();

    console.log(`\nCreating ReadStream with core:\n  ${message.key}`);
    for await (const _data of _bee.createReadStream()) {
      const newNode = await _data;
      console.log(
        `    Readed by stream is node ${newNode.value.type === "node"} key: ${
          newNode.key
        }`
      );

      if (newNode.value.type === "node") {
        await nodesDetector(newNode, message.key, "Reading");
      }
    }

    _bee.feed.on("download", async (index, data) => {
      // console.log(index);
      // console.log(data);
      try {
        const key = await (
          await _bee.getBlock(index, {
            valueEncoding: "json",
          })
        ).key.toString("utf8");
        // console.log(key);

        const newNode = await _bee.get(key);
        // console.log(newNode);

        console.log(
          `    Downloaded by core is node ${
            newNode.value.type === "node"
          } key: ${_bee.feed.key.toString("hex")}`
        );

        await nodesDetector(newNode, message.key, "Downloading");
      } catch (error) {
        console.log("Downloading Error", error);
      }
    });

    _bee.feed.download({ linear: true });
  }

  const nodesDetector = async (newNode, _coreKey, type) => {
    let _node = await current_bee.get(newNode.key);

    if (_coreKey === coreKey) {
      if (newNode === _node) {
        console.log("Current Node with coming node is same");
      } else {
        // console.log(newNode);
        console.log("Not allowing to change current node from out side");
      }
      return;
    }

    if (!_node || !_.isEqual(newNode.value.part, _node.value.part)) {
      console.log(`        ${!_node ? "Add a new" : "Upload a"} node: ${type}`);
      await current_bee.put(newNode.key, newNode.value);
    }
  };

  const SendMessageToPeer = (peerId, data) => {
    try {
      console.log(
        `Sending message to peers No: ${peers[peerId].seq}, PeerHost: ${peerId}`
      );
      peers[peerId].socket.write(JSON.stringify(data));
    } catch (error) {
      console.log(error)
    }
  };

  // const SendMessageToAllPeers = (data) => {
  //   console.log(`Sending message to all peers`);
  //   for (let id in peers) {
  //     console.log(`Peer Id: ${id}`);
  //     peers[id].socket.write(JSON.stringify(data));
  //   }
  // };

  // exports.AddNewNodePostman = async function (data) {
  //   var _currentNode = store
  //     .getState()
  //     .nodes.nodes.nodes.find(
  //       (item) => item.nodeHashKey === data.part.nodeHashKey
  //     );

  //   console.log(
  //     `${_currentNode ? "UpdateNodePostman" : "AddNewNodePostman"} >>>`
  //   );
  //   const node = new Node({
  //     created_time: _currentNode ? _currentNode.created_time : new Date(),
  //     updated_time: _currentNode ? new Date() : null,
  //     nodeHashKey: data.part.nodeHashKey,
  //     coreKey: data.part.coreKey,
  //     publicKey: data.part.publicKey,
  //     remoteSocket: data.part.remoteSocket,
  //   });
  //   console.log(node);

  //   await current_bee.put(data.part.coreKey, { type: "node", part: node });
  // };

  // exports.SendMessageToPeerCore = async function (data) {};

  exports.UpdateCurrentNode = async function (newNodeData) {
    // Update current node data to hypercore file
    await current_bee.put(coreKey, {
      type: "node",
      part: newNodeData,
    });
  }

  main();
}

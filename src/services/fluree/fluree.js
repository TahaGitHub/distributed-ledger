const store = require("../../store/store");

const { exec } = require("child_process");
const { isEmpty } = require("lodash");

const { NODE_TYPES, PUBLIC_HOSTIP, FLUREECONNECTING_PORT, FLUREEHOSTING_PORT, NODE_TYPE } = require("../../../config");
const hyperspace = require("../../utils/hyperspace/hyperspace");

function startUpFluree_kubernetes(servers) {
  const port = FLUREECONNECTING_PORT;
  const _port = FLUREEHOSTING_PORT;
  /*
  ** First of all will delete kubernetes
  */
  exec(`kubectl delete deploy fluree-deploy && kubectl delete svc fluree-svc`, async (error, stdout, stderr) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log('Deleted fluree deployment and service');
    }
    
    exec(`
      gawk -i inplace '/^[ \t]*- *name: *fdb_group_servers[ \t]*$/{p=NR} p && NR==p+1{sub(/value:.+/, "value: ${servers}")} 1' ./yamls/flureeDB.yaml &&
      gawk -i inplace '/^[ \t]*- *name: *fdb_group_this_server[ \t]*$/{p=NR} p && NR==p+1{sub(/value:.+/, "value: ${store.getState().keys.hashKey}")} 1' ./yamls/flureeDB.yaml &&

      gawk -i inplace '/^[ \t]*- *name: *fdb-api-port[ \t]*$/{p=NR} p && NR==p+1{sub(/value:.+/, "value: \\"${_port}\\"")} 1' ./yamls/flureeDB.yaml &&

      gawk -i inplace '/^[ \t]*- *name: *con-port-9790[ \t]*$/{p=NR} p && NR==p+1{sub(/containerPort:.+/, "containerPort: ${port}")} 1' ./yamls/flureeDB.yaml &&
      gawk -i inplace '/^[ \t]*- *name: *con-port-8090[ \t]*$/{p=NR} p && NR==p+1{sub(/containerPort:.+/, "containerPort: ${_port}")} 1' ./yamls/flureeDB.yaml &&

      gawk -i inplace '/^[ \t]*- *name: *svc-port-9790[ \t]*$/{p=NR} p && NR==p+1{sub(/targetPort:.+/, "targetPort: ${port}")} 1' ./yamls/flureeDB.yaml &&
      gawk -i inplace '/^[ \t]*- *name: *svc-port-9790[ \t]*$/{p=NR} p && NR==p+3{sub(/port:.+/, "port: ${port}")} 1' ./yamls/flureeDB.yaml &&
      gawk -i inplace '/^[ \t]*- *name: *svc-port-9790[ \t]*$/{p=NR} p && NR==p+4{sub(/nodePort:.+/, "nodePort: ${port}")} 1' ./yamls/flureeDB.yaml

      gawk -i inplace '/^[ \t]*- *name: *svc-port-8090[ \t]*$/{p=NR} p && NR==p+1{sub(/targetPort:.+/, "targetPort: ${_port}")} 1' ./yamls/flureeDB.yaml &&
      gawk -i inplace '/^[ \t]*- *name: *svc-port-8090[ \t]*$/{p=NR} p && NR==p+3{sub(/port:.+/, "port: ${_port}")} 1' ./yamls/flureeDB.yaml &&
      gawk -i inplace '/^[ \t]*- *name: *svc-port-8090[ \t]*$/{p=NR} p && NR==p+4{sub(/nodePort:.+/, "nodePort: ${_port}")} 1' ./yamls/flureeDB.yaml
    `);
  
    if (
      NODE_TYPE === NODE_TYPES.MASTER ||
      NODE_TYPE === NODE_TYPES.WORKER
    ) {
      exec(`gawk -i inplace '/^[ \t]*- *name: *fdb-join[ \t]*$/{p=NR} p && NR==p+1{sub(/value:.+/, "value: \\"true\\"")} 1' ./yamls/flureeDB.yaml`);      
    }
      
    exec(`kubectl create -f ./yamls/flureeDB.yaml`, (error, stdout, stderr) => {
      if (error) {
        console.log(error); 
      }
      console.log(`\n${stdout}`);
    });
  });

  // switch (NODE_TYPE) {
  //   case NODE_TYPES.MAIN_MASTER:
  //     // exec(`gawk -i inplace '/^[ \t]*- *name: *fdb-api-port[ \t]*$/{p=NR}
  //     //   p && NR==p+1{sub(/value:.+/, "value: ${fluServerPort ? fluServerPort : "8090"}")} 1' ./yamls/flureeDB.yaml`);
  //     break;
  //   case NODE_TYPES.MASTER:
  //   case NODE_TYPES.WORKER:

  //     exec(`kubectl create -f ./yamls/flureeDB.yaml`);

  //     // -Dfdb-group-log-directory=data/${
  //     //   store.getState().keys.hashKey
  //     // }/raft/ -Dfdb-storage-file-directory=data/${
  //     //   store.getState().keys.hashKey
  //     // }/fdb/
  //     break;
  //   default:
  //     break;
  // }
}

function startUpFluree_docker_compose(servers) {
  const port = FLUREECONNECTING_PORT;
  const _port = FLUREEHOSTING_PORT;

  exec(`cp ./yamls/fluree-basic.yaml ./yamls/fluree-docker-compose.yaml`);
  
  /*
  ** First of all will delete fluree containers if exist
  */
  exec(`docker rm -f fluree-db`, async (error, stdout, stderr) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log('Deleted fluree container');
    }

    exec(`
      sed -i "s/serverName1@Ip:Port */${servers}/g" ./yamls/fluree-docker-compose.yaml &&
      sed -i "s/serverName2 */${store.getState().keys.hashKey}/g" ./yamls/fluree-docker-compose.yaml &&
      sed -i "s/80901 */${_port}/g" ./yamls/fluree-docker-compose.yaml &&

      sed -i "s/\"9790:9790\" */\"${port}:${port}\"/g" ./yamls/fluree-docker-compose.yaml &&
      sed -i "s/\"8090:8090\" */\"${_port}:${_port}\"/g" ./yamls/fluree-docker-compose.yaml
    `);
      
    if (
      NODE_TYPE === NODE_TYPES.MASTER ||
      NODE_TYPE === NODE_TYPES.WORKER
    ) {
      exec(`
        sed -i "s/\"false\" */\"true\"/g" ./yamls/fluree-docker-compose.yaml
      `);      
    }
      
    exec(`docker-compose -f yamls/fluree-docker-compose.yaml up`, (error, stdout, stderr) => {
      if (error) {
        console.log(error); 
      }
      console.log(`\n${stdout}`);
    });
  });
}

function startUpFluree_docker(servers) {
  const port = FLUREECONNECTING_PORT;
  const _port = FLUREEHOSTING_PORT;
  
  /*
  ** First of all will delete fluree containers if exist
  */
  exec(`docker rm -f fluree-db`, async (error, stdout, stderr) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log('Deleted fluree container');
    }

    // --net dis-network \
    exec(`docker run \
      --restart unless-stopped \
      --env fdb_group_servers=${servers} \
      --env fdb_group_this_server=${store.getState().keys.hashKey} \
      --env fdb-api-port=${_port} \
      --env fdb-join=${(NODE_TYPE === NODE_TYPES.MASTER || NODE_TYPE === NODE_TYPES.WORKER) || false} \
      -p ${port}:${port} \
      -p ${_port}:${_port} \
      --name fluree-db fluree/ledger`, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
      }
      console.log(`\n${stdout}`);
    });
  });
}

function startUpFluree_man(servers) {
  switch (NODE_TYPE) {
    case NODE_TYPES.MAIN_MASTER:
      var _exec1 = exec(
        `$HOME/node/fluree/fluree_start.sh -Dfdb-group-servers=${servers} -Dfdb-group-this-server=${
          store.getState().keys.hashKey
        } -Dfdb-api-port=${FLUREEHOSTING_PORT}`
      );

      _exec1.stdout.on('data', function(data) {
        console.log(data); 
      })
      break;
    case NODE_TYPES.MASTER:
    case NODE_TYPES.WORKER:
      var _exec2 = exec(
        `$HOME/node/fluree/fluree_start.sh -Dfdb-join?=true -Dfdb-group-servers=${servers} -Dfdb-group-this-server=${
          store.getState().keys.hashKey
        } -Dfdb-api-port=${FLUREEHOSTING_PORT}`
      );

      _exec2.stdout.on('data', function(data) {
        console.log(data); 
      })
      break;
    default:
      break;
  }
}

// this.startUpFluree(null, null, 8090);
function serverFormat(serverName, serverHost, serevrPort) {
  return `${serverName}@${serverHost}:${serevrPort}`;
}

exports.main = async function () {
  /*
  ** Check fluree port from nodes file for avoiding double port for multi fluree on same network 
  ** Update flureePort 
  */
  const pubIp = await PUBLIC_HOSTIP;
  var currentNode = store.getState().nodes.nodes.nodes.find(item =>
    item.nodeHashKey === store.getState().keys.hashKey
  );
  var nodesLocalNet = store.getState().nodes.nodes.nodes.filter(item => 
    item.remoteSocket.remoteIP === pubIp
  );

  if (currentNode.remoteSocket.flureePort) {
    console.log('Old node fluree port: ', currentNode.remoteSocket.flureePort);
  } else if (nodesLocalNet.length === 1) {
    currentNode.remoteSocket.flureePort = FLUREECONNECTING_PORT;
    hyperspace.UpdateCurrentNode(currentNode);
  } else {
    var max = FLUREECONNECTING_PORT;
    nodesLocalNet.forEach(element => {
      if (max < element.remoteSocket?.flureePort) {
        max = element.remoteSocket.flureePort;
      }
    });
    
    currentNode.remoteSocket.flureePort = max === FLUREECONNECTING_PORT ? FLUREECONNECTING_PORT : max + 1;
    hyperspace.UpdateCurrentNode(currentNode);
  }
  
  const timer = setInterval(async () => {
    switch (NODE_TYPE) {
      case NODE_TYPES.MAIN_MASTER:
        if (!isEmpty(store.getState().keys.hashKey)) {
          const servers = serverFormat(
            store.getState().keys.hashKey,
            await PUBLIC_HOSTIP,
            FLUREECONNECTING_PORT,
          );
          startUpFluree_man(servers);
          clearInterval(timer);
        }
        break;
      case NODE_TYPES.MASTER:
      case NODE_TYPES.WORKER:
        if (previousNodesCount === 1) {
          console.log('Not finding other node, please wait');
        }

        var previousNodesCount = store.getState().nodes.nodes.count;
        setTimeout(async () => {
          if (
            previousNodesCount > 1 &&
            previousNodesCount === store.getState().nodes.nodes.count
          ) {
            console.log('Found other node, connecting...');

            var servers = "";
            await store.getState().nodes.nodes.nodes.forEach((element) => {
              if (element.remoteSocket?.flureePort) {
                if (servers !== "") {
                  servers += ",";
                }
                servers += serverFormat(
                  element.nodeHashKey,
                  element.remoteSocket.remoteIP,
                  element.remoteSocket.flureePort
                );
              }
            });
            clearInterval(timer);
            startUpFluree_man(servers);
          }
        }, 7000);
        break;
      default:
        console.log(">>>>>>>>>>>>> Wrong node tpye <<<<<<<<<<<<<");
        break;
    }
  }, 10000);
}

// exec(`gawk -i inplace '/^[ \t]*- *name: *fdb_group_servers[ \t]*$/{p=NR}
//   p && NR==p+1{sub(/value:.+/, "value: test111")} 1' ./yamls/flureeDB.yaml`);
// exec(`gawk -i inplace '/^[ \t]*- *name: *fdb_group_this_server[ \t]*$/{p=NR}
//   p && NR==p+1{sub(/value:.+/, "value: test222")} 1' ./yamls/flureeDB.yaml`);
// exec(`gawk -i inplace '/^[ \t]*- *name: *fdb-join[ \t]*$/{p=NR}
//   p && NR==p+1{sub(/value:.+/, "value: true")} 1' ./yamls/flureeDB.yaml`);

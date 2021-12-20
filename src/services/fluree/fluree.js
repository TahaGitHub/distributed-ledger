const store = require("../../store/store");

const { exec } = require("child_process");
const { isEmpty } = require("lodash");

const { NODE_TYPES, PUBLIC_HOSTIP, FLUREECONNECTING_PORT, FLUREEHOSTING_PORT, LOCAL_HOSTIP } = require("../../../config");

async function startUpFluree_kubernetes(servers) {
  const port = await FLUREECONNECTING_PORT;
  const _port = await FLUREEHOSTING_PORT;
  /*
  ** First of all will delete kubernetes
  */
  exec(`kubectl delete deploy fluree-deploy && kubectl delete svc fluree-svc`, async (error, stdout, stderr) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log('Deleted fluree deployment and service');
    }
    
    await exec(`
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
      process.env.npm_config_type === NODE_TYPES.MASTER ||
      process.env.npm_config_type === NODE_TYPES.WORKER
    ) {
      await exec(`gawk -i inplace '/^[ \t]*- *name: *fdb-join[ \t]*$/{p=NR} p && NR==p+1{sub(/value:.+/, "value: \\"true\\"")} 1' ./yamls/flureeDB.yaml`);      
    }
      
    exec(`kubectl create -f ./yamls/flureeDB.yaml`, (error, stdout, stderr) => {
      if (error) {
        console.log(error); 
      }
      console.log(`\n${stdout}`);
    });
  });

  // switch (process.env.npm_config_type) {
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

async function startUpFluree_docker(servers) {
  const port = await FLUREECONNECTING_PORT;
  const _port = await FLUREEHOSTING_PORT;

  exec(`cp ./yamls/fluree-basic.yaml ./yamls/fluee-docker-compose.yaml`);
  
  /*
  ** First of all will delete fluree containers if exist
  */
  exec(`docker rm -f fluree-db`, async (error, stdout, stderr) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log('Deleted fluree container');
    }

    await exec(`
      sed -i "s/serverName1@Ip:Port */${servers}/g" ./yamls/fluee-docker-compose.yaml &&
      sed -i "s/serverName2 */${store.getState().keys.hashKey}/g" ./yamls/fluee-docker-compose.yaml &&
      sed -i "s/80901 */${_port}/g" ./yamls/fluee-docker-compose.yaml &&

      sed -i "s/flureeHostIp */${LOCAL_HOSTIP}/g" ./yamls/fluee-docker-compose.yaml &&

      sed -i "s/\"9790:9790\" */\"${port}:${port}\"/g" ./yamls/fluee-docker-compose.yaml &&
      sed -i "s/\"8090:8090\" */\"${_port}:${_port}\"/g" ./yamls/fluee-docker-compose.yaml
    `);
      
    if (
      process.env.npm_config_type === NODE_TYPES.MASTER ||
      process.env.npm_config_type === NODE_TYPES.WORKER
    ) {
      await exec(`
        sed -i "s/\"false\" */\"true\"/g" ./yamls/fluee-docker-compose.yaml
      `);      
    }
      
    exec(`docker-compose -f yamls/fluee-docker-compose.yaml up`, (error, stdout, stderr) => {
      if (error) {
        console.log(error); 
      }
      console.log(`\n${stdout}`);
    });
  });
}

function startUpFluree_man(servers) {
  switch (process.env.npm_config_type) {
    case NODE_TYPES.MAIN_MASTER:
      exec(
        `./fluree-*/fluree_start.sh -Dfdb-group-servers=${servers} -Dfdb-group-this-server=${
          store.getState().keys.hashKey
        } -Dfdb-api-port=${FLUREEHOSTING_PORT}`
      );
      break;
    case NODE_TYPES.MASTER:
    case NODE_TYPES.WORKER:
      var _exec = exec(
        `./fluree-*/fluree_start.sh -Dfdb-join?=true -Dfdb-group-servers=${servers} -Dfdb-group-this-server=${
          store.getState().keys.hashKey
        } -Dfdb-api-port=${FLUREEHOSTING_PORT}`
      );

      _exec.stdout.on('data', function(data) {
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

exports.main = function () {
  const timer = setInterval(async () => {
    switch (process.env.npm_config_type) {
      case NODE_TYPES.MAIN_MASTER:
        if (!isEmpty(store.getState().keys.hashKey)) {
          const servers = serverFormat(
            store.getState().keys.hashKey,
            await PUBLIC_HOSTIP,
            await FLUREECONNECTING_PORT,
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
              if (servers !== "") {
                servers += ",";
              }
              servers += serverFormat(
                element.nodeHashKey,
                element.remoteSocket.remote,
                element.remoteSocket.port_db
              );
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

const openwhisk = require('openwhisk');

const fs = require('fs');
const { exec } = require("child_process");
const { isEmpty } = require('lodash');

const { BASEDIR, DIRECTORIES, FLUREEHOSTING_PORT, LOCAL_HOSTIP } = require('../../../config');
const { logWithColor } = require('../../helper/logs');

const options = {apihost: `http://${LOCAL_HOSTIP}:3233`, api_key: '23bc46b1-71f6-4ed5-8c54-816aa4f8c502:123zO3xZCLrMN6v2BKK1dXYFpXlPkccOFqm12CdAsMgRU4VrNZ9lyGVCGuMDGIwP'};
const ow = openwhisk(options);

function OpenwhiskCreateAllActions () {
  /*
  ** Get all action from _action file to create
  */
  fs.readdir(BASEDIR + DIRECTORIES.ACTIONS, (err, files) => {
    files.forEach(file => {
      console.log(`>>> ${file} <<<`);
      const actionName = file.replace('.zip','');
      const actionZipFile = fs.readFileSync(`${BASEDIR + DIRECTORIES.ACTIONS + file}`)
    
      OpenwhiskCreateAction(actionName, actionZipFile)
    });
  });
}

function OpenwhiskCreateAction (actionName, actionZipFile) {
  /*
  ** Delete action if exist
  */
  ow.actions.get(actionName).then(action => {
    console.log(`Deletting the ${actionName} action`);
    if (action) {
      ow.actions.delete(actionName);
    }
  }).catch(() => {
    console.log(`${actionName} action not found`);
  });

  /*
  ** Create action
  */
  ow.actions.create({ actionName, action: actionZipFile}).then(() => {
    logWithColor('green', `\nCreated ${actionName} action!\n`);
  });
}

exports.OpenwhiskInvoke = function (actionName, data) {
  /*
  ** Invoke action
  */
  return new Promise(function(resolve, reject) {
      const blocking = true, result = true;
      ow.actions.invoke({actionName, blocking, result, params: { params: data.params, info: { ip: LOCAL_HOSTIP, port: FLUREEHOSTING_PORT }}}).then(__result => {
        console.log(__result)
        resolve(__result)
      }).catch(err => {
        console.error('failed to invoke actions', err)
        reject({
          state: false,
          error: err,
          mes: 'Error with invoke action'
        });
      })
  })
}

function OpenwhiskDeleteAllActions () {
  /*
  ** Delete all actions
  */
  ow.actions.list().then(list => {
    if (isEmpty(list)) {
      console.log('No action found');
      return;
    }
    
    list.forEach(item => {
      ow.actions.delete(item.name);
      logWithColor('red', `Deleted ${item.name}`)
    })
  });
}

async function startUpOpenwhisk_kubernetes() {
  /*
  ** First of all will delete Openwhisk container if exist and kubernetes pod 
  */
  exec(`kubectl delete pod openwhisk-pod`, (error, stdout, stderr) => {
    if (error) {
      console.log(error.message)
    } else {
      logWithColor('red','Deleted openwhisk-pod pod\n');
    }
  
    exec(`sudo docker rm -f openwhisk`, (error, stdout, stderr) => {
      if (error) {
        console.log(error.message);
      } else {
        logWithColor('red','Deleted openwhisk docker container\n');
      }
      
      /*
      ** Create Openwhisk pod and openwhisk docker image
      ** Note: Pod just for check if openwhsik container running 
      */
      exec(`kubectl create -f ./yamls/openWhisk.yaml`, (error, stdout, stderr) => {
        if (error) {
          console.log(error.message);
        } else {
          console.log(`\n${stdout}`);
          const timer = setInterval(() => {
            ow.actions.list().then(list => {
              if (isEmpty(list)) {
                console.log('\nNo action found');
                clearInterval(timer);
                OpenwhiskCreateAllActions();
              } else {
                console.log('\nAction found list ', list);
                OpenwhiskDeleteAllActions().then(() => {
                  clearInterval(timer);
                  OpenwhiskCreateAllActions();
                })
              }
            })
            .catch(err => {
              console.log('Please wait until container be ready', err.message)
            });
          }, 5000);
        }
      });
    });
  });
}

function startUpOpenwhisk_docker() {
  /*
  ** Delete Openwhisk container if exist
  */
  exec(`docker rm -f openwhisk`, (error, stdout, stderr) => {
    if (error) {
      console.log(error.message);
    } else {
      logWithColor('red', '\nDeleted openwhisk\n');
    }

    // --net dis-network \
    exec(`docker run \
      -p ${LOCAL_HOSTIP}:3233:3233 \
      -v /var/run/docker.sock:/var/run/docker.sock \
      --name openwhisk openwhisk/standalone:nightly`, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Configure openwhisk...');
      }

      console.log(`\n${stdout}`);
    });
    
    const timer = setInterval(() => {
      ow.actions.list().then(list => {
        if (isEmpty(list)) {
          logWithColor('green', '\nNo action found');
          clearInterval(timer);
          OpenwhiskCreateAllActions();
        } else {
          logWithColor('green', '\nAction found list ', list);
          OpenwhiskDeleteAllActions().then(() => {
            clearInterval(timer);
            OpenwhiskCreateAllActions();
          })
        }
      })
      .catch(err => {
        console.log('Please wait until container be ready', err.message)
      });
    }, 5000);
  });
}

exports.main = function () {
  startUpOpenwhisk_docker();
}

// OpenwhiskDeleteAllActions();
// OpenwhiskCreateAllActions();

const FilesController = require("../helper/files-controller");
const CreaterFile = require("../helper/files-controller");
const { FILES } = require("../../config");

class User {
  constructor({ created_time, user_hash, user_public }) {
    // this.status = 'active',
    this.created_time = created_time;
    // this.updated_time = '';
    this.user_hash = user_hash;
    this.user_public = user_public;
    // this.passes = [];
  }

  static genesisFile() {
    if (CreaterFile.isExistsFile(FILES.users)) {
      return CreaterFile.loadDataFile(FILES.users);
    }

    let nodesFile = {
      modified: false,
      created_time: new Date(),
      updated_time: "",
      modifiers: [],
      count: 0,
      users: new Array(),
    };

    return CreaterFile.createSaveFile(FILES.users, nodesFile);
  }

  // static insertNewUserDB( user_hash, user_public) {
  //   var newNode = new User( user_hash, user_public );

  //   console.log('insert new user db');
  // };

  // static updateUserDB({ userID, data }) {
  //   console.log('update db');
  // };
}

module.exports = User;

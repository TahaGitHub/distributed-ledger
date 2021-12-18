const fs = require("fs");
const { BASEDIR, DIRECTORIES } = require("../../config");

module.exports = (fileName) => {
  var folderPath = BASEDIR;

  if (process.env.JEST_WORKER_ID) {
    //You are in test mode.
    folderPath += DIRECTORIES.TEST;
  } else {
    folderPath += DIRECTORIES.FILES;
  }

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    // console.log('>> Created Main Folder <<');
  }

  if (fileName.includes(".json")) {
    folderPath += DIRECTORIES.DB;
  } else if (fileName.includes(".key")) {
    folderPath += DIRECTORIES.CRPTO;
  } else {
    folderPath += DIRECTORIES.FILES;
  }

  return folderPath;
};

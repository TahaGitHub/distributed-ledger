const fs = require("fs");

const PathController = require("./path-controller");

class ControllerFile {
  static createSaveFile(fileName, data) {
    const path = PathController(fileName);

    if (!fs.existsSync(path)) {
      // console.log(`Created new folder under name: ${fileName}`);
      fs.mkdirSync(path);
    }

    if (fileName.includes(".json")) {
      data = JSON.stringify(data, null, 2);
    } else {
      data = data.toString();
    }

    fs.writeFileSync(path + "/" + fileName, data, (err) => {
      // In case of a error throw err.
      console.log(err);
      if (err) throw err;

      // console.log(`Storing data:\n${data}`);
    });

    console.log(`Created >> ${fileName} << file`);

    return data;
  }

  static isExistsFile(fileName) {
    const path = PathController(fileName);
    return fs.existsSync(path + "/" + fileName);
  }

  static loadDataFile(fileName) {
    const path = PathController(fileName);

    let rawData = fs.readFileSync(path + "/" + fileName, "utf8");

    if (fileName.includes(".json")) {
      return JSON.parse(rawData);
    } else if (fileName.includes(".key")) {
      return rawData.replace("\n", "");
    } else {
      return rawData.toString();
    }
  }

  static updateDataFile(fileName, data) {
    const path = PathController(fileName);
    fs.writeFileSync(path + "/" + fileName, data);
  }

  /*
   ** BackUp File
   ** Delete File
   ** ...
   */
}

module.exports = ControllerFile;

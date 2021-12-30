exports.logWithColor = async function (color, string) {
  switch (color) {
    case "black":
      color = '\x1b[30m';
      break;
    case "red":
      color = '\x1b[31m';
      break;
    case "green":
      color = '\x1b[32m';
      break;
    case "yellow":
      color = '\x1b[33m';
      break;
    case "blue":
      color = '\x1b[34m';
      break;
    case "magenta":
      color = '\x1b[35m';
      break;
    case "cyan":
      color = '\x1b[36m';
      break;
    case "white":
      color = '\x1b[37m';
      break;
    default:
      break;
  }

  console.log(
    /* 
    ** Set text color
    ** re-set text color to white
    */ 
    color, string, `\x1b[37m` 
  );
}
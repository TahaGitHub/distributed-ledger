function sortBy_hashKey(data) {
  if (data.length === 1) {
    return data;
  }

  return data.sort(function (_a, _b) {
    var a = _a.nodeHashKey.toUpperCase(); // ignore upper and lowercase
    var b = _b.nodeHashKey.toUpperCase(); // ignore upper and lowercase
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  });
}

function sortBy_Time(data) {
  if (data.length === 1) {
    return data;
  }

  return data.sort(function (_a, _b) {
    var a = new Date(_a.created_time).getTime(); // ignore upper and lowercase
    var b = new Date(_b.created_time).getTime(); // ignore upper and lowercase
    return a - b;
  });
}

module.exports = {
  sortBy_Time,
  sortBy_hashKey,
};

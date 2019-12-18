function objToArray(obj) {
  let arr = [];
  for (const [key, value] of Object.entries(obj)) {
    arr.push(value);
  }
  return arr;
}

module.exports.objToArray = objToArray;

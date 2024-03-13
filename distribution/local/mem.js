const { id, serialize } = require('../util/util')

const mem = {};

global.localMap = new Map();

mem.put = function (value, key, callback) {
  callback = callback || function () { };
  localMap = global.localMap;
  if (!localMap) {
    callback(new Error('Local storage not found'), null);
    return;
  }
  if (!key) {
    key = id.getID(value);
  }
  if (localMap.has(key)) {
    callback(null, value);
    return;
  }
  localMap.set(key, value);
  callback(null, value);
  return;
};

mem.get = function (key, callback) {
  callback = callback || function () { };
  localMap = global.localMap;
  if (!localMap) {
    callback(new Error('Local storage not found'), null);
    return;
  }
  if(!key){
    callback(null, [...localMap.keys()]);
    return;
  }
  if(!localMap.has(key)){
    console.log(localMap);
    callback(new Error('Key not find'), null);
    return;
  }
  callback(null, localMap.get(key));
  return;
};

mem.del = function (key, callback) {
  callback = callback || function () { };
  localMap = global.localMap;
  if (!localMap) {
    callback(new Error('local storage not found'), null);
    return;
  }
  if(!localMap.has(key)){
    callback(new Error('key not find'), null);
    return;
  }
  const deletedVal = localMap.get(key);
  localMap.delete(key);
  callback(null, deletedVal);
  return;
}

module.exports = mem;
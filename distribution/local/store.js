//  ________________________________________
// / NOTE: You should use absolute paths to \
// | make sure they are agnostic to where   |
// | your code is running from! Use the     |
// \ `path` module for that purpose.        /
//  ----------------------------------------
//         \   ^__^
//          \  (oo)\_______
//             (__)\       )\/\
//                 ||----w |
//                 ||     ||

const fs = require('fs');
const path = require('path');
const {id, serialize, deserialize} = require('../util/util');

const store = {};

store.put = function(value, key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key || id.getID(value);
    gid = 'local';
  } else {
    realKey = key.key || id.getID(value);
    gid = key.gid;
  }
  const storeFolderPath = path.join(__dirname, '../../store', gid);
  if (!fs.existsSync(storeFolderPath)) {
    fs.mkdirSync(storeFolderPath, {recursive: true});
  }

  const filePath = path.join(storeFolderPath, realKey);

  if (fs.existsSync(filePath)) {
    callback(null, value);
    return;
  }

  fs.writeFile(filePath, serialize(value), (err) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, value);
  });
};

store.get = function(key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key;
    gid = 'local';
  } else {
    realKey = key.key;
    gid = key.gid;
  }
  const storeFolderPath = path.join(__dirname, '../../store', gid);
  if (!fs.existsSync(storeFolderPath)) {
    callback(new Error('Group file storage not found!'), null);
    return;
  }
  if (!realKey) {
    fs.readdir(storeFolderPath, (err, files) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, files);
    });
    return;
  }

  const filePath = path.join(storeFolderPath, realKey);
  if (!fs.existsSync(filePath)) {
    callback(new Error('Key not found'), null);
    return;
  }

  fs.readFile(filePath, {encoding: 'utf8'}, (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, deserialize(data));
    return;
  });
};

store.del = function(key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key;
    gid = 'local';
  } else {
    realKey = key.key;
    gid = key.gid;
  }

  const storeFolderPath = path.join(__dirname, '../../store', gid);
  if (!fs.existsSync(storeFolderPath)) {
    callback(new Error('Group file storage not found!'), null);
    return;
  }

  const filePath = path.join(storeFolderPath, realKey);

  if (!fs.existsSync(filePath)) {
    callback(new Error('Key not found'), null);
    return;
  }

  fs.readFile(filePath, {encoding: 'utf8'}, (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    fs.unlink(filePath, (err) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, deserialize(data));
      return;
    });
  });
};

module.exports = store;

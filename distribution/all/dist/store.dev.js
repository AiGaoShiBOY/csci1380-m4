"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var _require = require('../util/util'),
    id = _require.id;

var store = function store(config) {
  var context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  var distribution = global.distribution;

  if (!distribution) {
    throw new Error('Distribution not found');
  }

  return {
    put: function put(value, key, callback) {
      callback = callback || function () {};

      distribution.local.groups.get(context.gid, function (e, v) {
        if (e) {
          callback(e, null);
          return;
        } // get all the nodes


        var nodesArray = Object.values(v);
        var nids = nodesArray.map(function (node) {
          return id.getNID(node);
        }); // get the hash of the value
        // if the key is null, do multiple hash;

        if (!key) {
          key = id.getID(value);
        }

        var kid = id.getID(key);
        var expectedHash = context.hash(kid, nids.slice());
        var targetIdx = nids.indexOf(expectedHash);
        var targetNode = nodesArray[targetIdx];
        var keyWithGid = {
          key: key,
          gid: context.gid
        };
        var message = [value, keyWithGid];
        var remoteWithNode = {
          node: {
            ip: targetNode.ip,
            port: targetNode.port
          },
          service: 'store',
          method: 'put'
        };
        distribution.local.comm.send(message, remoteWithNode, function (e, v) {
          if (e) {
            callback(e, null);
            return;
          }

          callback(null, v);
          return;
        });
      });
    },
    get: function get(key, callback) {
      callback = callback || function () {};

      distribution.local.groups.get(context.gid, function (e, v) {
        if (e) {
          callback(e, null);
          return;
        }

        if (key) {
          // get all the nodes
          var nodesArray = Object.values(v);
          var nids = nodesArray.map(function (node) {
            return id.getNID(node);
          }); // get the hash of the value

          var kid = id.getID(key);
          var expectedHash = context.hash(kid, nids.slice());
          var targetIdx = nids.indexOf(expectedHash);
          var targetNode = nodesArray[targetIdx];
          var keyWithGid = {
            key: key,
            gid: context.gid
          };
          var message = [keyWithGid];
          var remoteWithNode = {
            node: {
              ip: targetNode.ip,
              port: targetNode.port
            },
            service: 'store',
            method: 'get'
          }; //send to the specified node to get the value

          distribution.local.comm.send(message, remoteWithNode, function (e, v) {
            if (e) {
              callback(e, null);
              return;
            }

            callback(null, v);
            return;
          });
        } else {
          // if the key is null, send the message to all 
          var _keyWithGid = {
            key: key,
            gid: context.gid
          };
          var _message = [_keyWithGid];
          var remote = {
            service: 'store',
            method: 'get'
          };
          distribution[context.gid].comm.send(_message, remote, function (e, v) {
            var _ref;

            if (!v || Object.keys(v).length === 0) {
              callback(new Error('There is no data stored of given group', null));
              return;
            }

            var allKeys = (_ref = []).concat.apply(_ref, _toConsumableArray(Object.values(v)));

            callback({}, allKeys);
            return;
          });
        }
      });
    },
    del: function del(key, callback) {
      callback = callback || function () {};

      distribution.local.groups.get(context.gid, function (e, v) {
        if (e) {
          callback(e, null);
          return;
        } // get all the nodes


        var nodesArray = Object.values(v);
        var nids = nodesArray.map(function (node) {
          return id.getNID(node);
        }); // get the hash of the value

        var kid = id.getID(key);
        var expectedHash = context.hash(kid, nids.slice());
        var targetIdx = nids.indexOf(expectedHash);
        var targetNode = nodesArray[targetIdx];
        var keyWithGid = {
          key: key,
          gid: context.gid
        };
        var message = [keyWithGid];
        var remoteWithNode = {
          node: {
            ip: targetNode.ip,
            port: targetNode.port
          },
          service: 'store',
          method: 'del'
        }; //send to the specified node to get the value

        distribution.local.comm.send(message, remoteWithNode, function (e, v) {
          if (e) {
            callback(e, null);
            return;
          }

          callback(null, v);
          return;
        });
      });
    },
    reconf: function reconf(originalGroup, callback) {
      callback = callback || function () {};

      distribution.local.groups.get(context.gid, function (e, v) {
        if (e) {
          callback(e, null);
          return;
        } // get all the nodes


        var oldGroup = Object.values(originalGroup);
        var newGroup = Object.values(v); // get all the keys

        distribution[context.gid].store.get(null, function (e, v) {
          if (Object.keys(e).length !== 0) {
            callback(e, null);
            return;
          }

          var oldNids = oldGroup.map(function (node) {
            return id.getNID(node);
          });
          var newNids = newGroup.map(function (node) {
            return id.getNID(node);
          }); // iterate every key

          var needReconf = 0;
          v.forEach(function (key) {
            var kid = id.getID(key);
            var oldHash = context.hash(kid, oldNids.slice());
            var newHash = context.hash(kid, newNids.slice()); // needs relocate

            if (oldHash !== newHash) {
              needReconf += 1; // del data in the old node

              oldIdx = oldNids.indexOf(oldHash);
              oldNode = oldGroup[oldIdx];
              var keyWithGid = {
                key: key,
                gid: context.gid
              };
              var message = [keyWithGid];
              var oldRemote = {
                node: {
                  ip: oldNode.ip,
                  port: oldNode.port
                },
                service: 'store',
                method: 'del'
              };
              distribution.local.comm.send(message, oldRemote, function (e, value) {
                if (e) {
                  callback(e);
                  return;
                } // put the data to the new node
                // the data deleted is store in value


                newIdx = newNids.indexOf(newHash);
                newNode = newGroup[newIdx];
                var keyWithGid = {
                  key: key,
                  gid: context.gid
                };
                var message = [value, keyWithGid];
                var newRemote = {
                  node: {
                    ip: newNode.ip,
                    port: newNode.port
                  },
                  service: 'store',
                  method: 'put'
                };
                distribution.local.comm.send(message, newRemote, function (e, v) {
                  if (e) {
                    callback(e);
                    return;
                  }

                  needReconf -= 1;

                  if (needReconf === 0) {
                    callback(null, 1);
                  }
                });
              });
            }
          });
        });
      });
    }
  };
};

module.exports = store;
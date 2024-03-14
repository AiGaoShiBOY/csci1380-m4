const { id } = require('../util/util');

const mem = function (config) {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  // if (!distribution) {
  //   throw new Error('Distribution not found');
  // }
  return {
    put: function (value, key, callback) {
      callback = callback || function () { };
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        // if the key is null, do multiple hash;
        if (!key) {
          key = id.getID(value);
        }
        const kid = id.getID(key);
        const expectedHash = context.hash(kid, nids);

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        const keyWithGid = {
          key: key,
          gid: context.gid
        }

        const message = [value, keyWithGid];
        const remoteWithNode = {
          node: { ip: targetNode.ip, port: targetNode.port },
          service: 'mem',
          method: 'put',
        };
        distribution.local.comm.send(message, remoteWithNode, (e, v) => {
          if (e) {
            callback(e, null);
            return;
          }
          callback(null, v);
          return;
        });
      });
    },
    get: function (key, callback) {
      callback = callback || function () { };
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        if (key) {
          // get all the nodes
          const nodesArray = Object.values(v);
          const nids = nodesArray.map((node) => id.getNID(node));

          // get the hash of the value
          const kid = id.getID(key);
          const expectedHash = context.hash(kid, nids);

          const targetIdx = nids.indexOf(expectedHash);
          const targetNode = nodesArray[targetIdx];

          const keyWithGid = {
            key: key,
            gid: context.gid
          }
          const message = [keyWithGid];
          const remoteWithNode = {
            node: { ip: targetNode.ip, port: targetNode.port },
            service: 'mem',
            method: 'get',
          };
          //send to the specified node to get the value
          distribution.local.comm.send(message, remoteWithNode, (e, v) => {
            if (e) {
              callback(e, null);
              return;
            }
            callback(null, v);
            return;
          });
        } else {
          // if the key is null, send the message to all 
          const keyWithGid = {
            key: key,
            gid: context.gid
          };
          const message = [keyWithGid];
          const remote = { service: 'mem', method: 'get' }
          distribution[context.gid].comm.send(message, remote, (e, v) => {
            if (!v || Object.keys(v).length === 0) {
              callback(new Error('There is no data stored of given group', null));
              return;
            }
            const allKeys = [].concat(...Object.values(v));
            callback({}, allKeys);
            return;
          });
        }
      });
    },
    del: function (key, callback) {
      callback = callback || function () { };
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        const kid = id.getID(key);
        const expectedHash = context.hash(kid, nids);

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        const keyWithGid = {
          key: key,
          gid: context.gid
        }

        const message = [keyWithGid];
        const remoteWithNode = {
          node: { ip: targetNode.ip, port: targetNode.port },
          service: 'mem',
          method: 'del',
        };

        //send to the specified node to get the value
        distribution.local.comm.send(message, remoteWithNode, (e, v) => {
          if (e) {
            callback(e, null);
            return;
          }
          callback(null, v);
          return;
        });
      });
    },
  };
};

module.exports = mem;
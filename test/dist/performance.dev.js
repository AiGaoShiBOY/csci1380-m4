"use strict";

global.nodeConfig = {
  ip: '127.0.0.1',
  port: 6001
};

var distribution = require('../distribution');

var id = distribution.util.id;

var _require = require('perf_hooks'),
    performance = _require.performance;

var groupsTemplate = require('../distribution/all/groups'); // This group is used for testing most of the functionality


var mygroupGroup = {};
var localServer = null;
var n1 = {
  ip: '127.0.0.1',
  port: 9000
};
var n2 = {
  ip: '127.0.0.1',
  port: 9001
};
var n3 = {
  ip: '127.0.0.1',
  port: 8002
};
var remote = {
  service: 'status',
  method: 'stop'
};
remote.node = n1;
distribution.local.comm.send([], remote, function (e, v) {
  remote.node = n2;
  distribution.local.comm.send([], remote, function (e, v) {
    remote.node = n3;
    distribution.local.comm.send([], remote, function (e, v) {});
  });
});
mygroupGroup[id.getSID(n1)] = n1;
mygroupGroup[id.getSID(n2)] = n2;
mygroupGroup[id.getSID(n3)] = n3;
var t1 = performance.now();

var testTime = function testTime(e, v) {
  var mygroupConfig = {
    gid: 'mygroup'
  };
  groupsTemplate(mygroupConfig).put(mygroupConfig, mygroupGroup, function (e, v) {
    var i = 0;

    for (var j = 0; j < 1000; j++) {
      key = "object" + j;
      value = {
        first: "1",
        second: "2",
        third: "3",
        forth: '4',
        last: '5'
      };
      distribution.mygroup.store.put(value, key, function (e, v) {
        i += 1;

        if (i === 1000) {
          var t2 = performance.now();
          console.log('Throughput: ', t2 - t1);
          distribution.mygroup.store.get("object0", function (e, v) {
            var t3 = performance.now();
            console.log('latency: ', t3 - t2);
            distribution.mygroup.status.stop(function (e, v) {
              var remote = {
                service: 'status',
                method: 'stop'
              };
              remote.node = n1;
              distribution.local.comm.send([], remote, function (e, v) {
                remote.node = n2;
                distribution.local.comm.send([], remote, function (e, v) {
                  remote.node = n3;
                  distribution.local.comm.send([], remote, function (e, v) {});
                });
              });
            });
          });
        }
      });
    }
  });
};

distribution.node.start(function (server) {
  distribution.local.status.spawn(n1, function (e, v) {
    distribution.local.status.spawn(n2, function (e, v) {
      distribution.local.status.spawn(n3, testTime);
    });
  });
});
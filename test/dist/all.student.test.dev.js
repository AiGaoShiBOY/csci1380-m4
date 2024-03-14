"use strict";

global.nodeConfig = {
  ip: '127.0.0.1',
  port: 7000
};

var distribution = require('../distribution');

var id = distribution.util.id;

var groupsTemplate = require('../distribution/all/groups'); // This group is used for testing most of the functionality


var mygroupGroup = {}; // These groups are used for testing hashing

var group1Group = {};
var group2Group = {};
var group3Group = {}; // This group is used for {adding,removing} {groups,nodes}

var group4Group = {};
/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/

var localServer = null;
var n1 = {
  ip: '127.0.0.1',
  port: 8000
};
var n2 = {
  ip: '127.0.0.1',
  port: 8001
};
var n3 = {
  ip: '127.0.0.1',
  port: 8002
};
var n4 = {
  ip: '127.0.0.1',
  port: 8003
};
var n5 = {
  ip: '127.0.0.1',
  port: 8004
};
var n6 = {
  ip: '127.0.0.1',
  port: 8005
};
beforeAll(function (done) {
  // First, stop the nodes if they are running
  var remote = {
    service: 'status',
    method: 'stop'
  };
  remote.node = n1;
  distribution.local.comm.send([], remote, function (e, v) {
    remote.node = n2;
    distribution.local.comm.send([], remote, function (e, v) {
      remote.node = n3;
      distribution.local.comm.send([], remote, function (e, v) {
        remote.node = n4;
        distribution.local.comm.send([], remote, function (e, v) {
          remote.node = n5;
          distribution.local.comm.send([], remote, function (e, v) {
            remote.node = n6;
            distribution.local.comm.send([], remote, function (e, v) {});
          });
        });
      });
    });
  });
  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;
  group1Group[id.getSID(n4)] = n4;
  group1Group[id.getSID(n5)] = n5;
  group1Group[id.getSID(n6)] = n6;
  group2Group[id.getSID(n1)] = n1;
  group2Group[id.getSID(n3)] = n3;
  group2Group[id.getSID(n5)] = n5;
  group3Group[id.getSID(n2)] = n2;
  group3Group[id.getSID(n4)] = n4;
  group3Group[id.getSID(n6)] = n6;
  group4Group[id.getSID(n1)] = n1;
  group4Group[id.getSID(n2)] = n2;
  group4Group[id.getSID(n4)] = n4; // Now, start the base listening node

  distribution.node.start(function (server) {
    localServer = server;

    var groupInstantiation = function groupInstantiation(e, v) {
      var mygroupConfig = {
        gid: 'mygroup'
      };
      var group1Config = {
        gid: 'group1',
        hash: id.naiveHash
      };
      var group2Config = {
        gid: 'group2',
        hash: id.consistentHash
      };
      var group3Config = {
        gid: 'group3',
        hash: id.rendezvousHash
      };
      var group4Config = {
        gid: 'group4'
      }; // Create some groups

      groupsTemplate(mygroupConfig).put(mygroupConfig, mygroupGroup, function (e, v) {
        groupsTemplate(group1Config).put(group1Config, group1Group, function (e, v) {
          groupsTemplate(group2Config).put(group2Config, group2Group, function (e, v) {
            groupsTemplate(group3Config).put(group3Config, group3Group, function (e, v) {
              groupsTemplate(group4Config).put(group4Config, group4Group, function (e, v) {
                done();
              });
            });
          });
        });
      });
    }; // Start the nodes


    distribution.local.status.spawn(n1, function (e, v) {
      distribution.local.status.spawn(n2, function (e, v) {
        distribution.local.status.spawn(n3, function (e, v) {
          distribution.local.status.spawn(n4, function (e, v) {
            distribution.local.status.spawn(n5, function (e, v) {
              distribution.local.status.spawn(n6, groupInstantiation);
            });
          });
        });
      });
    });
  });
});
afterAll(function (done) {
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
        distribution.local.comm.send([], remote, function (e, v) {
          remote.node = n4;
          distribution.local.comm.send([], remote, function (e, v) {
            remote.node = n5;
            distribution.local.comm.send([], remote, function (e, v) {
              remote.node = n6;
              distribution.local.comm.send([], remote, function (e, v) {
                localServer.close();
                done();
              });
            });
          });
        });
      });
    });
  });
});
test('test del for non-existing keys', function (done) {
  distribution.mygroup.store.del('dummy', function (e, v) {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    } catch (error) {
      done(error);
    }
  });
});
test('test get for non-existing keys', function (done) {
  distribution.mygroup.store.get('dummy', function (e, v) {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    } catch (error) {
      done(error);
    }
  });
});
test('test put idempotency (store)', function (done) {
  var user = {
    first: 'Josiah',
    last: 'Carberry'
  };
  var key = 'jcarbmpg';
  distribution.mygroup.store.put(user, key, function (e, v) {
    distribution.mygroup.store.put(user, key, function (e, v) {
      distribution.mygroup.store.get(key, function (e, v) {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(user);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
test('test get idempotency (mem)', function (done) {
  var user = {
    first: 'Josiah',
    last: 'Carberry'
  };
  var key = 'jcarbmpg';
  distribution.mygroup.mem.put(user, key, function (e, v) {
    distribution.mygroup.mem.get(key, function (e, v) {
      expect(e).toBeFalsy();
      expect(v).toEqual(user);
      distribution.mygroup.mem.get(key, function (e, v) {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(user);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
test('test group isolating', function (done) {
  var key = {
    key: "test",
    gid: "mygroup"
  };
  var user = {
    first: 'Josiah',
    last: 'Carberry'
  };
  var message = [user, key];
  var remote = {
    node: n6,
    service: 'mem',
    method: 'put'
  };
  distribution.local.comm.send(message, remote, function (e, v) {
    var key = {
      key: "test",
      gid: "group1"
    };
    var user = {
      first: 'Josiah',
      last: 'Carberry'
    };
    var message = [user, key];
    var remote = {
      node: n6,
      service: 'mem',
      method: 'put'
    };
    distribution.local.mem.get('test', function (e, v) {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    });
  });
});
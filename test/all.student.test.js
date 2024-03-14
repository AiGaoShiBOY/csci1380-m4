global.nodeConfig = { ip: '127.0.0.1', port: 7000 };
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');

// This group is used for testing most of the functionality
const mygroupGroup = {};
// These groups are used for testing hashing
const group1Group = {};
const group2Group = {};
const group3Group = {};
// This group is used for {adding,removing} {groups,nodes}
const group4Group = {};


/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

const n1 = { ip: '127.0.0.1', port: 8000 };
const n2 = { ip: '127.0.0.1', port: 8001 };
const n3 = { ip: '127.0.0.1', port: 8002 };
const n4 = { ip: '127.0.0.1', port: 8003 };
const n5 = { ip: '127.0.0.1', port: 8004 };
const n6 = { ip: '127.0.0.1', port: 8005 };

beforeAll((done) => {
  // First, stop the nodes if they are running
  let remote = { service: 'status', method: 'stop' };

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
            });
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
  group4Group[id.getSID(n4)] = n4;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;

    const groupInstantiation = (e, v) => {
      const mygroupConfig = { gid: 'mygroup' };
      const group1Config = { gid: 'group1', hash: id.naiveHash };
      const group2Config = { gid: 'group2', hash: id.consistentHash };
      const group3Config = { gid: 'group3', hash: id.rendezvousHash };
      const group4Config = { gid: 'group4' };

      // Create some groups
      groupsTemplate(mygroupConfig)
        .put(mygroupConfig, mygroupGroup, (e, v) => {
          groupsTemplate(group1Config)
            .put(group1Config, group1Group, (e, v) => {
              groupsTemplate(group2Config)
                .put(group2Config, group2Group, (e, v) => {
                  groupsTemplate(group3Config)
                    .put(group3Config, group3Group, (e, v) => {
                      groupsTemplate(group4Config)
                        .put(group4Config, group4Group, (e, v) => {
                          done();
                        });
                    });
                });
            });
        });
    };

    // Start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, (e, v) => {
            distribution.local.status.spawn(n5, (e, v) => {
              distribution.local.status.spawn(n6, groupInstantiation);
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    let remote = { service: 'status', method: 'stop' };
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n4;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n5;
            distribution.local.comm.send([], remote, (e, v) => {
              remote.node = n6;
              distribution.local.comm.send([], remote, (e, v) => {
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



test('test del for non-existing keys', (done) => {
  distribution.mygroup.store.del('dummy', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('test get for non-existing keys', (done) => {
  distribution.mygroup.store.get('dummy', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('test put idempotency (store)', (done) => {
  const user = { first: 'Josiah', last: 'Carberry' };
  const key = 'jcarbmpg';
  distribution.mygroup.store.put(user, key, (e, v) => {
    distribution.mygroup.store.put(user, key, (e, v) => {
      distribution.mygroup.store.get(key, (e, v) => {
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

test('test get idempotency (mem)', (done) => {
  const user = { first: 'Josiah', last: 'Carberry' };
  const key = 'jcarbmpg';
  distribution.mygroup.mem.put(user, key, (e, v) => {
    distribution.mygroup.mem.get(key, (e, v) => {
      expect(e).toBeFalsy();
      expect(v).toEqual(user);
      distribution.mygroup.mem.get(key, (e, v) => {
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

test('test group isolating', (done) => {
  const key = {
    key: "test",
    gid: "mygroup"
  }
  const user = { first: 'Josiah', last: 'Carberry' };
  const message = [user, key];
  const remote = { node: n6, service: 'mem', method: 'put' };
  distribution.local.comm.send(message, remote, (e, v) => {
    const key = {
      key: "test",
      gid: "group1"
    }
    const user = { first: 'Josiah', last: 'Carberry' };
    const message = [user, key];
    const remote = { node: n6, service: 'mem', method: 'put' };
    distribution.local.mem.get('test', (e, v) => {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    });
  })
});




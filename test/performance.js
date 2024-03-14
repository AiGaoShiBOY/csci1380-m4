global.nodeConfig = { ip: '127.0.0.1', port: 6001 };
const distribution = require('../distribution');
const id = distribution.util.id;
const { performance } = require('perf_hooks');

const groupsTemplate = require('../distribution/all/groups');

// This group is used for testing most of the functionality
const mygroupGroup = {};

let localServer = null;

const n1 = { ip: '127.0.0.1', port: 9000 };
const n2 = { ip: '127.0.0.1', port: 9001 };
const n3 = { ip: '127.0.0.1', port: 8002 };

let remote = { service: 'status', method: 'stop' };

remote.node = n1;
distribution.local.comm.send([], remote, (e, v) => {
  remote.node = n2;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n3;
    distribution.local.comm.send([], remote, (e, v) => {

    });
  });
});

mygroupGroup[id.getSID(n1)] = n1;
mygroupGroup[id.getSID(n2)] = n2;
mygroupGroup[id.getSID(n3)] = n3;

const t1 = performance.now();


const testTime = (e, v) => {
  const mygroupConfig = { gid: 'mygroup' };
  groupsTemplate(mygroupConfig)
    .put(mygroupConfig, mygroupGroup, (e, v) => {
      let i = 0;
      for (let j = 0; j < 1000; j++) {
        key = "object" + j;
        value = {
          first: "1",
          second: "2",
          third: "3",
          forth: '4',
          last: '5'
        }
        distribution.mygroup.store.put(value, key, (e, v) => {
          i += 1
          if (i === 1000) {
            const t2 = performance.now();
            console.log('Throughput: ', t2 - t1);
            distribution.mygroup.store.get("object0", (e, v) => {
              const t3 = performance.now()
              console.log('latency: ', t3 - t2);
              distribution.mygroup.status.stop((e, v) => {
                let remote = { service: 'status', method: 'stop' };
                remote.node = n1;
                distribution.local.comm.send([], remote, (e, v) => {
                  remote.node = n2;
                  distribution.local.comm.send([], remote, (e, v) => {
                    remote.node = n3;
                    distribution.local.comm.send([], remote, (e, v) => { });
                  });
                });
              });
            });
          }
        })
      }
    });
}

distribution.node.start((server) => {
  distribution.local.status.spawn(n1, (e, v) => {
    distribution.local.status.spawn(n2, (e, v) => {
      distribution.local.status.spawn(n3, testTime);
    });
  });
});




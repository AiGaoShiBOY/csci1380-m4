const assert = require('assert');
var crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  node = { ip: node.ip, port: node.port };
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function idToNum(id) {
  let n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  const idList = nids.map((e) => {
    return idToNum(e);
  });
  const sortedIdsList = idList.slice().sort((a, b) => a - b);
  const knum = idToNum(kid);
  let nextIndex = sortedIdsList.findIndex(num => num >= knum);
  if (nextIndex === -1) {
    nextIndex = 0;
  }
  const nextIdNum = sortedIdsList[nextIndex];
  return nids.find(nid => idToNum(nid) === nextIdNum);
}



function rendezvousHash(kid, nids) {
  let maxNum = -Infinity;
  let res;
  for(let nid of nids){
    const concated  = kid + nid;
    const id = getID(concated);
    const idNum = idToNum(id);
    if(idNum > maxNum){
      maxNum = idNum;
      res = nid;
    }
  }
  return res; 
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
  idToNum: idToNum,
  naiveHash: naiveHash,
  consistentHash: consistentHash,
  rendezvousHash: rendezvousHash,
};

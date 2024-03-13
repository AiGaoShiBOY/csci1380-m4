const mem = function(config){
  let context = {};
  context.gid = config.gid || 'all';
  let distribution = global.distribution;
  if (!distribution) {
    throw new Error('Distribution not found');
  }
  return {};
};

module.exports = mem;
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Disable hierarchical lookup to prevent walking up or through duplicate node_modules
config.resolver.disableHierarchicalLookup = true;

// Exclude nested Womup Admin project from Metro crawler & resolver
const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : (config.resolver.blockList ? [config.resolver.blockList] : []);

config.resolver.blockList = [
  ...defaultBlockList,
  new RegExp('^' + path.resolve(__dirname, 'Womup Admin') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, 'backend') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, 'Womup Admin.zip') + '.*'),
];

module.exports = config;

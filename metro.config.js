const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves packages directly from project node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Exclude nested Womup Admin project from Metro crawler & resolver
const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : (config.resolver.blockList ? [config.resolver.blockList] : []);

config.resolver.blockList = [
  ...defaultBlockList,
  new RegExp('^' + path.resolve(__dirname, 'Womup Admin') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, 'Womup Rider') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, 'Womup Store') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, 'backend') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, 'Womup Admin.zip') + '.*'),
];

module.exports = config;

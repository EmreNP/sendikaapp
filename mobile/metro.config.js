const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// shared/ klasörünü Metro'nun izlediği klasörlere ekle
config.watchFolders = [path.resolve(workspaceRoot, 'shared')];

// shared/ klasöründeki modülleri çözümleyebilmesi için node_modules'u belirt
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;

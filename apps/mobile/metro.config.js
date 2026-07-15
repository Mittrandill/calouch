// Expo monorepo kurulumu.
// Metro varsayılan olarak yalnız uygulama klasörünü izler; workspace
// paketlerindeki (@calouch/*) değişiklikler bu ayar olmadan görünmez ve
// import'lar çözülmez.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// packages/* içindeki kaynak değişince Fast Refresh tetiklensin.
config.watchFolders = [workspaceRoot];

// .npmrc'de node-linker=hoisted olduğu için bağımlılıklar kökte toplanır;
// yine de her iki yol da aranır.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Workspace paketleri derlenmiş dist yerine kaynaktan tüketilir; ayrı bir
// build adımı olmadan tek React kopyası kullanılır.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

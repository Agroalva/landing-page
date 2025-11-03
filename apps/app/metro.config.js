const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable package exports to resolve Better Auth exports
config.resolver.unstable_enablePackageExports = true;

module.exports = config;


const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@supabase/supabase-js']
      }
    },
    argv
  );

  // Copy public folder to output
  config.plugins.push(
    new (require('copy-webpack-plugin'))({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist'),
          noErrorOnMissing: true,
        },
      ],
    })
  );

  // Ensure service worker is copied
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'GenerateSW' || plugin.constructor.name === 'InjectManifest') {
      plugin.config.exclude = [/\.map$/, /asset-manifest\.json$/];
    }
  });

  return config;
};

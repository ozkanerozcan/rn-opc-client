const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add public folder to asset extensions for web
config.resolver.assetExts.push('css');

// Configure for web static assets
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Serve public folder assets
      if (req.url.startsWith('/manifest.json') || 
          req.url.startsWith('/service-worker.js') ||
          req.url.startsWith('/offline.html') ||
          req.url.startsWith('/icons/') ||
          req.url.startsWith('/favicon.ico')) {
        req.url = '/public' + req.url;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;

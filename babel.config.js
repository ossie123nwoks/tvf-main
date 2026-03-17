module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
          '@/components': './components',
          '@/lib': './lib',
          '@/types': './types',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ];

  // Strip console.log/warn/error in production builds
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};


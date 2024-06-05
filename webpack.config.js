const path = require('path');

module.exports = {
  entry: [
    'core-js/stable',
    'regenerator-runtime/runtime',
    './public/js/index.js',
  ], // Ajoutez core-js et regenerator-runtime ici
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/js/dist'), // Dossier de sortie mis à jour
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/', // Dossier de sortie pour les fichiers
              publicPath: 'assets/', // Chemin public pour les fichiers
            },
          },
        ],
      },
    ],
  },
};

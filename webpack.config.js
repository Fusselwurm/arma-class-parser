module.exports = {
    entry: './src/class-parser-web.ts',
    output: {
        path: __dirname + '/web',
        filename: 'arma-class-parser.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {test: /\.tsx?$/, loader: 'ts-loader'}
        ]
    }
};

const path = require("path");

module.exports = ((env) => {

    const prod = (!!env) && (env["mode"] === "prod");

    return {
        entry: "./src/index.ts",
        mode: prod ? "production" : "development",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [{
                        loader: 'ts-loader',
                        options: {
                            configFile: "tsconfig.webpack.json"
                        }
                    }],
                    exclude: /node_modules|types|tests|dist|umd/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            fallback: {
                "buffer": false
            },
            alias: {
                "canvas": false
            }
        },
        output: {
            path: path.resolve(__dirname, "umd"),
            filename: prod ? "enqr.min.js" : "enqr.js",
            globalObject: "this",
            library: {
                name: "enqr",
                type: "umd"
            }
        }
    };

});
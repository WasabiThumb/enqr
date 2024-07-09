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
                "buffer": require.resolve("buffer/")
            },
            // Trick iconv-lite into excluding tables that we dont actually need for our use case
            alias: {
                "./tables/big5-added.json": false,
                "./tables/cp949.json": false,
                "./tables/cp950.json": false,
                "./tables/gb18030-ranges.json": false,
                "./tables/gbk-added.json": false,
                "./utf7": false,
                "./utf32": false,
                "./sbcs-data-generated": path.resolve(__dirname, "patches/sbcs-data-generated.js"),
                "./sbcs-data": path.resolve(__dirname, "patches/sbcs-data.js")
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
        },
        externals: {
            canvas: false
        }
    };

});
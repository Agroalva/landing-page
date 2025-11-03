const path = require("path");

module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            "babel-preset-expo",
        ],
        plugins: [
            [
                "module-resolver",
                {
                    root: [__dirname],
                    extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
                    alias: {
                        // Fallback for @better-auth/expo/client if package exports don't resolve
                        // Use .cjs for better Metro/React Native compatibility
                        "@better-auth/expo/client": path.resolve(__dirname, "node_modules/@better-auth/expo/dist/client.cjs"),
                    },
                },
            ],
        ],
    };
};


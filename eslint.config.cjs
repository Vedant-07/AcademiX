module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { "vars": "all", "args": "none" }]
    }
  }
];

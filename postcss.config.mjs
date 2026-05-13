const isTestRun = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

const config = {
  plugins: isTestRun
    ? {}
    : {
        "@tailwindcss/postcss": {},
      },
};

export default config;

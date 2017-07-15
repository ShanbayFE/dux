import babel from 'rollup-plugin-babel';

const babelConfig = babel({
    presets: [['env', { modules: false }]],
    plugins: ['transform-runtime'],
    babelrc: false,
    runtimeHelpers: true,
});

export default {
    entry: `src/index.js`,
    dest: `lib/index.js`,
    format: 'cjs',
    plugins: [babelConfig],
};

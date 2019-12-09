import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import sucrase from 'rollup-plugin-sucrase';
import pkg from './package.json';

const config = {
    input: 'src/index.js',
    
    // self-serve-ui project already includes React and Lodash as dependencies,
    // no reason to bundle these with Statium
    external: [
        'react',
        'lodash.get',
        'lodash.set',
        'lodash.has',
        'lodash.clone',
        'lodash.defer',
        'lodash.upperfirst',
    ],
    
    context: null,
    
    // Rollup will warn about mixing default exports with named exports.
    // I do not consider this a bad practice, so do React authors.
    onwarn: (warning, warn) => {
        if (warning.code === 'MIXED_EXPORTS') {
            return;
        }
        
        warn(warning);
    },
};

export default [{
    ...config,
    
    output: [{
        file: pkg.main,
        format: 'cjs',
    }, {
        file: pkg.module,
        format: 'es',
    }],
    
    plugins: [
        resolve({
            extensions: ['.js']
        }),
        babel({
            exclude: ['node_modules/**'],
            runtimeHelpers: true,
        }),
        commonjs(),
    ],
}, {
    ...config,
    
    output: [{
        file: pkg["module-es6+"],
        format: 'es',
    }],
    
    plugins: [
        resolve({
            extensions: ['.js']
        }),
        sucrase({
            exclude: ['node_modules/**'],
            transforms: ['jsx']
        }),
        commonjs(),
    ],
}];

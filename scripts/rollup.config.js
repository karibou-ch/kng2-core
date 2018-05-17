import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import angular from 'rollup-plugin-angular';
import typescript from 'rollup-plugin-typescript';
var sass = require('node-sass');

// Add here external dependencies that actually you use.
const globals = {
};

export default {
    entry: './dist/modules/kng2-core.es5.js',
    dest: './dist/bundles/kng2-core.umd.js',
    format: 'umd',
    sourceMap:false,
    moduleName: 'kng2-core',
    plugins: [resolve()],
    external: Object.keys(globals),
    globals: globals,
    plugins: [
        angular({
            preprocessors:{
                template:template => template,
                style: scss => {
                    let css;
                    if(scss){
                    css = sass.renderSync({ data: scss }).css.toString();
                    console.log(css);
                    }else{
                    css = '';
                    }
                    
                    return css;
                },
            }
        }),
        typescript({
            typescript:require('typescript')
        }),
        resolve({
            module: true,
            main: true
        }),
        commonjs({
            include: 'node_modules/**',
        })
    ],
    onwarn: warning => {
        const skip_codes = [
        'THIS_IS_UNDEFINED',
        'MISSING_GLOBAL_NAME'
        ];
        if (skip_codes.indexOf(warning.code) != -1) return;
        console.error(warning);
    }
}


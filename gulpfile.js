const gulp  = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const eslint = require('gulp-eslint');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const zip = require('gulp-zip');

const cp = require('child_process');
const fs = require('fs');
const pkg = require('./package.json');

const VERSION = pkg.version;
const COPYRIGHT =
`/**
 * Particleground.js v${ VERSION } (https://github.com/Barrior/Particleground.js)
 * Copyright 2016 Barrior <Barrior@qq.com>
 * Licensed under the MIT (https://opensource.org/licenses/mit-license.php)
 */
`;

const dist = './public/dist';
const src = './public/src';
let online = false;

gulp.task('sass',function(){
    if( online ){
        return gulp.src(`${src}/sass/build.scss`)
            .pipe(sass())
            .pipe(
                autoprefixer({
                    browsers: [ 'IE >= 9', 'Firefox > 10', 'chrome > 10' ]
                })
            )
            .pipe(cssmin())
            .pipe(rename('site.css'))
            .pipe(gulp.dest(`${dist}/css/`))
    }
    gulp.src(`${src}/sass/build.scss`)
       .pipe(sourcemaps.init())
       .pipe(
           sass({
               outputStyle: 'expanded'
           })
       )
       .pipe(
           autoprefixer({
               browsers: [ 'IE >= 9', 'Firefox > 10', 'chrome > 10' ]
           })
       )
       .pipe(cssmin())
       .pipe(rename('site.css'))
       .pipe(sourcemaps.write('./map'))
       .pipe(gulp.dest(`${dist}/css/`))
});

gulp.task('js',function(){
    if( online ){
        return gulp.src(`${src}/js/site.js`)
            .pipe(uglify())
            .pipe(gulp.dest(`${dist}/js/`))
    }
    gulp.src(`${src}/js/site.js`)
       .pipe(gulp.dest(`${dist}/js/`))
});

gulp.task('default',function(){
    gulp.watch([`${src}/sass/*.scss`],function(){
        gulp.run('sass');
    });
    gulp.watch([`${src}/js/*.js`],function(){
        gulp.run('js');
    });
});

// use for branch duapp
gulp.task('online', function(){
    online = true;
    ['css', 'js'].forEach(v => {
        cp.exec(`rm -rf ${dist}/${v}/map`, (err, stdout, stderr) => {
            !err && console.log(`${dist}/${v}/map【文件夹删除成功】`);
        });
    });
    gulp.run('sass');
    gulp.run('js');
});

// use for npm publish
gulp.task('npm', function(){
    fs.readFile('./NPMREADME.md', (err, data) => {
        if( !err ){
            fs.writeFile('./README.md', data, (err) => {
                !err && console.log('README.md【改写成功】');
            })
        }
    });
});

// pack pjs to dev environment
let packDirPath = './pjs-dev/pjs/';
gulp.task('pack-pjs', function () {
    gulp.watch([ packDirPath + '*.js' ], function(){
        fs.readdir(packDirPath, function(err, files){

            files = files.join(' ').replace( /particleground\.js\s|particleground\.all\.js\s/g, '');
            files = ( 'particleground.js ' + files ).split(' ');
            files.forEach(function( v, i, array ){
                array.splice( i, 1, packDirPath + v );
            });

            gulp.src( files )
                .pipe( concat( 'particleground.all.js' ) )
                .pipe( gulp.dest( packDirPath ) )
        });
    });
});

// build pjs production
let prodDir = `pjs-production/${ VERSION }/`;
gulp.task('build-prod', function () {
    gulp.src( packDirPath + '*.js' )
        .pipe( uglify() )
        .pipe( gulp.dest( prodDir ) )
        .on('end', addCopyright);
});

// move production to web site
gulp.task('move', function () {
    gulp.src( prodDir + 'particleground.all.js' )
        .pipe( gulp.dest( `${dist}/js/` ) );

    gulp.src( prodDir + '*' )
        .pipe( zip('particleground.js.zip') )
        .pipe( gulp.dest( dist ) );
});

function addCopyright(){
    [
        'particleground.all.js',
        'particleground.js'
    ]
    .forEach(function( v ){
        let filename = prodDir + v;
        fs.readFile( filename, function( err, data ){
            let writeData = COPYRIGHT + data.toString();
            if( !err ){
                fs.writeFile( filename, writeData, function( err ){
                    !err && console.log( filename + '【写入成功】' );
                });
            }
        });
    });
}
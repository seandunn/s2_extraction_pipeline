//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
// Generated on 2013-08-01 using generator-webapp 0.2.6
'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist',
        test: 'test'
    };

    grunt.initConfig({
        yeoman: yeomanConfig,
        watch: {
            pipeline: {
              files: [
                '<%= yeoman.app %>/config/pipelines/{,*/}*.json',
                '<%= yeoman.app %>/scripts/lib/pipeline_config_schema.json'
              ],
              tasks: ['pipeline']
            },
            compass: {
                files: [
                  '<%= yeoman.app %>/styles/{,*/}*.{scss,sass}',
                  '<%= yeoman.app %>/scripts/app-components/{,*/}*.{scss,sass}'
                ],
                tasks: ['compass:server']
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '<%= yeoman.app %>/*.html',
                    '{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
                    '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
                    '{.tmp,<%= yeoman.app %>}/scripts/app-components/{,*/}*.js',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= yeoman.test %>/spec/{,*}*.js'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, yeomanConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 9001,
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, '.')
                        ];
                    }
                }
            },
            dist: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, yeomanConfig.dist)
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>/index.html'
            },
            test: {
                path: 'http://localhost:<%= connect.test.options.port %>/test/index.html'
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/{,*/}*.js',
                '!<%= yeoman.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: {
                options: {
                    run: false,
                    urls: ['http://localhost:<%= connect.test.options.port %>/test/index.html']
                }
            }
        },
        pipeline: {
          files: ['<%= yeoman.app %>/config/pipelines/*.json'],
          outFile: '<%= yeoman.app %>/scripts/pipeline_config-DO_NOT_DIRECTLY_EDIT.json',
          schemaPath: '<%= yeoman.app %>/scripts/lib/pipeline_config_schema.json'
        },
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '.tmp/styles',
                generatedImagesDir: '.tmp/images/generated',
                imagesDir: '<%= yeoman.app %>/images',
                javascriptsDir: '<%= yeoman.app %>/scripts',
                fontsDir: '<%= yeoman.app %>/styles/fonts',
                importPath: '<%= yeoman.app %>/components',
                httpImagesPath: '/images',
                httpGeneratedImagesPath: '/images/generated',
                httpFontsPath: '/styles/fonts',
                relativeAssets: false
            },
            dist: {},
            server: {
                options: {
                    debugInfo: true
                }
            }
        },
        // not used since Uglify task does concat,
        // but still available if needed
        /*concat: {
            dist: {}
        },*/
        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: yeomanConfig.app + '/scripts',
                    optimize: 'none',
                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    //generateSourceMaps: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
                    useStrict: true,
                    wrap: true
                    //uglify2: {} // https://github.com/mishoo/UglifyJS2
                }
            }
        },
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
                        '<%= yeoman.dist %>/styles/fonts/*'
                    ]
                }
            }
        },
        useminPrepare: {
            options: {
                dest: '<%= yeoman.dist %>'
            },
            html: '<%= yeoman.app %>/index.html'
        },
        usemin: {
            options: {
                dirs: ['<%= yeoman.dist %>']
            },
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css']
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/images'
                },
                {
                    expand: true,
                    cwd: '<%= yeoman.app %>/styles/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/styles/images'
                }]
            }
        },
        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        cssmin: {
            // This task is pre-configured if you do not wish to use Usemin
            // blocks for your CSS. By default, the Usemin block from your
            // `index.html` will take care of minification, e.g.
            //
            //     <!-- build:css({.tmp,app}) styles/main.css -->
            //
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>',
                    src: '*.html',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        // Put files not handled in other tasks here
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        'images/{,*/}*.{webp,gif,svg}',
                        'styles/fonts/*',
                        'scripts/lib/**/*.xls' // Matches xls files in lib directory and all its subdirectories
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: [
                        'generated/*'
                    ]
                }]
            }
        },
        concurrent: {
            server: [
                'compass'
            ],
            test: [
                // 'coffee'
            ],
            dist: [
                // 'coffee',
              'pipeline',
                'compass',
                'imagemin',
                // 'svgmin',
                'htmlmin'
            ]
        },
        bower: {
            options: {
                exclude: ['modernizr']
            },
            all: {
                rjsConfig: '<%= yeoman.app %>/scripts/main.js'
            }
        },
        cucumberjs: {
            files: 'test/features',
            options: {
                steps: 'test/features/step_definitions',
                format: 'pretty'
            }
        },
        createComponent: {
            dir: '<%= yeoman.app %>/scripts/app-components',
            blueprintDir: '<%= yeoman.app %>/scripts/app-components/blueprints',
            blueprintComponentName: 'component.js'
        }
    });

    grunt.registerTask('server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'open:server', 'connect:dist:keepalive']);
        }

        if (target === 'test') {
            return grunt.task.run([
                'open:test',
                'connect:test:keepalive'
            ]);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'pipeline',
            'connect:livereload',
            'open:server',
            'watch'
        ]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'connect:test',
        'mocha'
    ]);

    grunt.registerTask('testAll', [
        'test'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'concurrent:dist',
        'requirejs',
        'concat',
        'cssmin',
        'uglify',
        'copy:dist',
        'rev',
        'usemin'
    ]);

    grunt.registerTask('createComponent', function() {

        var name = grunt.option("name");

        if (!name) {
            grunt.fail.fatal("A file name must be specified.\nExample: grunt createComponent --name:re-racking");
        }

        var config   = grunt.config.get(this.name),
            new_path     = [config.dir, name].join("/"),
            new_component = [new_path, name+".js"].join("/"),
            blueprint_component = [new_path, config.blueprintComponentName].join("/"),
            filesCreated = 0;

        if (grunt.file.isDir(new_path)) {
            grunt.fail.fatal("Directory " + new_path + " already exists!");
        }

        // Copy over files from "blueprint" directory
        grunt.file.recurse(config.blueprintDir, function(abspath, rootdir, subdir, filename) {
            var filePath = [new_path, filename].join("/");
            grunt.file.write(filePath, grunt.file.read(abspath).replace(/<<componentName>>/g, name));
            grunt.log.writeln("New file: " + filePath + " created");
            filesCreated++;
        });

        // Rename component to name
        grunt.file.copy(blueprint_component, new_component);
        grunt.log.writeln("Renamed " + blueprint_component + " to " + new_component);

        // ...then delete the blueprint_component
        grunt.file.delete(blueprint_component);

        grunt.log.ok(filesCreated + " files created in " + new_path).ok();
    });

    grunt.registerTask('pipeline', 'Verify and compile pipeline configs', function(){
      grunt.log.subhead("Parsing pipeline configs...");
      var JaySchema = require('jayschema');
      var js = new JaySchema();

      var options = grunt.config.get(this.name);

      grunt.log.writeflags(options);
      var schema = grunt.file.readJSON(options.schemaPath);

      var filePath = options.files;

      var files = grunt.file.expand(filePath);
      var pipelineConfig = { role_priority: [], workflows: [] };
      var configFile, errs;

      for(var i in files){
        configFile = grunt.file.readJSON(files[i]);

        grunt.log.writeln('Processing '+files[i]);

        errs       = js.validate(configFile, schema);
        if (errs.length > 0) {
          errs.map(function(schemaError){
            grunt.log.errorlns('instanceContext: ' + schemaError.instanceContext);
            grunt.log.errorlns('resolutionScope: ' + schemaError.resolutionScope);
            grunt.log.errorlns('constaintName: '   + schemaError.constaintName);
            grunt.log.errorlns('constaintValue: '  + schemaError.constaintValue);
            grunt.log.errorlns('testedValue: '     + schemaError.testedValue);
            grunt.log.writeln();
            grunt.log.writeln();
          });

          grunt.fail.warn('Failed to parse piepline file: '+ files[i]);
        }
        else {
          pipelineConfig.role_priority = pipelineConfig.role_priority.concat(configFile.role_priority);
          pipelineConfig.workflows     = pipelineConfig.workflows.concat(configFile.workflows);
          grunt.log.ok('...validated OK.');
        }

      }

      grunt.log.writeln('Validating combined pipeline config file...');
      errs = js.validate(configFile, schema);

      if (errs.length > 0) {
        errs.map(function(schemaError){
          grunt.log.errorlns('instanceContext: ' + schemaError.instanceContext);
          grunt.log.errorlns('resolutionScope: ' + schemaError.resolutionScope);
          grunt.log.errorlns('constaintName: '   + schemaError.constaintName);
          grunt.log.errorlns('constaintValue: '  + schemaError.constaintValue);
          grunt.log.errorlns('testedValue: '     + schemaError.testedValue);
          grunt.log.writeln();
          grunt.log.writeln();
        });

        grunt.fail.warn('Validation failed');
      }
      else {
        grunt.log.ok('...validated OK.');
        grunt.log.ok('Writing combined pipeline_config to: '+options.outFile);
        grunt.file.write(options.outFile, JSON.stringify(pipelineConfig));
      }

    });

    grunt.registerTask('default', [
      'jshint',
      'test',
      'build'
    ]);
};

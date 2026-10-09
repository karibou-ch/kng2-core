// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const fs = require('fs');

if (!process.env.CHROME_BIN) {
  const chromeBin = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/chromium/current/usr/lib/chromium-browser/chrome'
  ].find(bin => fs.existsSync(bin));
  if (chromeBin) {
    process.env.CHROME_BIN = chromeBin;
  }
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../../coverage/kng2-core'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: true
  });
};

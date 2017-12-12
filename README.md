# Kng2Core (AKA King Kong II) means karibou.ch Angular 2 kore Library :rocket:
This project will provide a standalone angular2 library that implement all core features (API mapping) of karibou.ch. 
The module goal mainly provide a kickstart kit to make every new idea/motivation web application/ionic declinaison without friction.

[![David](https://img.shields.io/david/karibou-ch/kng2-core.svg?style=flat)](https://david-dm.org/karibou-ch/kng2-core)
[![Build Status](https://travis-ci.org/karibou-ch/kng2-core.svg?branch=master)](https://travis-ci.org/karibou-ch/kng2-core)
[![Gitter](https://badges.gitter.im/karibou-ch/kng2-core.svg)](https://gitter.im/karibou-ch/kng2-core?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Authors & special thanks :heart:

- David Gonzalez, https://github.com/GonzalD
- Matthieu Vallat, https://github.com/VallatMa 
- Yann Doudin, https://github.com/doudiny 
- Evalet Olivier, https://github.com/evaletolab
- Noria Foukia Enseignante en mathématiques @HEPIA 
- Arnaud Deglise Fondateur de Panier Local @Fribourg

## Installation as library
    npm install kng2-core

## Prerequisites for development 
install node.js with [NVM](https://github.com/creationix/nvm) (required). 

    nvm install v6.9.5
    nvm use v6.9.5

Get sources

    git clone https://github.com/karibou-ch/kng2-core
    cd kng2-core
    npm install
    npm run watch
    
# Application example
    cd ng-test
    npm install
    ng serve
    chromium `http://localhost:4200/`

Before using the library, you must check or set your default config in bootstrap application, `app.component.ts` in our example
```javascript
    this.config.setDefaultConfig({
       API_SERVER:'http://you.api.point.here',
       others....
    });
```


## AoT
* https://gist.github.com/chuckjaz/65dcc2fd5f4f5463e492ed0cb93bca60

## Unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## End-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.


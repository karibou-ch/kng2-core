# Kng2Core (AKA King Kong II) means karibou.ch Angular 2 (>=4.1.0) kore Library :rocket:
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

## Install and using Karibou king kong II 
First, create or use a new application
```bash
    npm install -g @angular/cli
    ng new karibou-super-idea && cd karibou-super-idea
```
    
Next, install King Kong II    
```bash
    npm install kng2-core
```

Before using the library, you must set default configuration in your application, eg. `app.component.ts` 
```javascript
// importing King Kong II
import { IsAuthenticated, Kng2CoreModule } from 'kng2-core';

// activate routes
const appRoutes: Routes = [
  { path: 'edit/routes', canActivate: [IsAuthenticated], [...] },
  ...
];

//
// configure King Kong II module
@NgModule({
  declarations: [
    AppComponent,
    ...
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    Kng2CoreModule.forRoot(kng2Config),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```



## Prerequisites for development 
install node.js with [NVM](https://github.com/creationix/nvm) (required). 

    nvm install stable # currently v9.2.0
    nvm use stable

Get sources

    git clone https://github.com/karibou-ch/kng2-core
    cd kng2-core
    npm install
    npm run build:watch
    
# Application example
    cd ng-test
    npm install
    ng serve
    chromium `http://localhost:4200/`




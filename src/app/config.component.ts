    import { Component }    from '@angular/core';
    import { Observable }   from 'rxjs/Observable';

    import { ConfigService }    from '../../module/config.service';
    
    @Component({
      selector: 'my-config',
      template: `
        <h1>Affichage de la config serveur</h1>
        
        `,
        providers: [ ConfigService ]
    })
    export class ConfigComponent {
      
    }
import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map'

import { Config } from './config';



@Injectable()
export class ConfigService {

  public defaultConfig={
    API_SERVER:'http://localhost:4000',

    API_VERSION:'/v1',

    LOG_LEVEL:'debug',

    AUTH_SUCCESS_REDIRECT_URL:'/',
    AUTH_ERROR_REDIRECT_URL:'/login',


    uploadcare:'b51a13e6bd44bf76e263',

    staticMapKey:"AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU",

    disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56', /*karibou dev*/
    // disqus:'a0602093a94647cd948e95fadb9b9e38'; /*karibou prod*/

    github:{
      repo: 'evaletolab/karibou-doc',
      token: '7b24b8ec909903ad91d4548fc6025badaf1501bc'
    },

    cover:'',
    // cover:'img/home-site.jpg';

    postfinance:{
      url: 'https://e-payment.postfinance.ch/ncol/test/orderstandard_utf8.asp'
    },

    user:{
      photo: '//placehold.it/80x80',
    },

    shared:{
      photo: {
        fg: "//placehold.it/400x300",
        owner: "//placehold.it/80x80&text=owner",
        bg: ''
      }
    },
    loginPath:['/admin', '/account'],
    readonlyPath:['/wallet/create'],
    avoidShopUIIn:['/admin', '/login', '/signup', '/page'],

    // providers:[
    //   { name: 'twitter', url: this.config.API_SERVER + '/auth/twitter' },
    //   { name: 'google+', url: this.config.API_SERVER + '/auth/google' },
    //   { name: 'persona', url: this.config.API_SERVER + '/auth/browserid' },
    // ],

    // otherproviders:[
    //   { name: 'google+', url: this.config.API_SERVER + '/auth/google' },
    //   { name: 'facebook', url: this.config.API_SERVER + '/auth/facebook' },
    //   { name: 'linkedin', url: this.config.API_SERVER + '/auth/linkedin' },
    //   { name: 'github', url: this.config.API_SERVER + '/auth/github' }
    // ]
  };

  private headers: Headers;
  public config:Observable<Config>;

  constructor(
    public http: Http
  ) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    // this.config= Observable.of(new Config);
    this.config = this.http.get(this.defaultConfig.API_SERVER + '/v1/config?lang=', {
      headers: this.headers,
      withCredentials: true,
    })
      .map(res => {
        let config={shared:{}};
        Object.assign(config,this.defaultConfig)
        Object.assign(config.shared, res.json());
        return config;
      });
  }

  getConfig(): Observable<Config> {
    return this.config;
  }
}

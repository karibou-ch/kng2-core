import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class ConfigService {

  API_SERVER:'';
  
  API_VERSION: '/v1';

  LOG_LEVEL: 'debug';
  
  AUTH_SUCCESS_REDIRECT_URL:'/';
  AUTH_ERROR_REDIRECT_URL:'/login';


  uploadcare:'b51a13e6bd44bf76e263';

  staticMapKey:"AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU";

  disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56'; /*karibou dev*/ 
  // disqus:'a0602093a94647cd948e95fadb9b9e38'; /*karibou prod*/

  github:{
      repo:'evaletolab/karibou-doc';
      token:'7b24b8ec909903ad91d4548fc6025badaf1501bc'      
  };
  
  cover:'';
  // cover:'img/home-site.jpg';
  
  postfinance:{
    url:'https://e-payment.postfinance.ch/ncol/test/orderstandard_utf8.asp';
  };

  user:{
    photo:'//placehold.it/80x80';
  };

  shop:{
    photo:{
      fg:"//placehold.it/400x300";
      owner:"//placehold.it/80x80&text=owner";
      bg:''
    }
  };
  loginPath:['/admin','/account'];
  readonlyPath:['/wallet/create'];
  avoidShopUIIn:['/admin','/login','/signup','/page']  

  private headers:Headers;

  constructor(
    public http: Http            
  ) { 
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');    
    this.http.get(this.API_SERVER+'/v1/config?lang='+$translate.use(),{headers:this.headers})
        .map(res => {
          Object.assign(this.shop,res.json())
        });

    // $http.get(defaultConfig.API_SERVER+'/v1/config?lang='+$translate.use()).then(function(response){
    //   response.data.shippingweek=
    //   response.data.shippingweek&&
    //   response.data.shippingweek.map(function(date) {
    //     return new Date(date);
    //   });

    //   angular.extend(defaultConfig.shop,response.data);
    //   deferred.resolve(defaultConfig);
    // });


  }

}

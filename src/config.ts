


export class Config{
  constructor(){
    this.shared={};
    this.isAvailable=false;
  }
  isAvailable:boolean;
  shared:any;

  API_SERVER:string;
  API_VERSION:string;

  LOG_LEVEL:string;

  AUTH_SUCCESS_REDIRECT_URL:string;
  AUTH_ERROR_REDIRECT_URL:string;

  user:any;
  loader:string[];

  loginPath:string[];
  readonlyPath:string[];
  avoidShopUIIn:string[];
}

export enum ConfigKeyStoreEnum{
  KIO2_LOGIN_REMEMBER   = 0,
  KIO2_SERVER           = 1
}
export var config:Config = new Config();

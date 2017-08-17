


export class Config{
  constructor(){
    this.shared={};
    this.isAvailable=false;
  }
  isAvailable:boolean;
  shared:any;
}

export var config:Config = new Config();

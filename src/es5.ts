//
// useful statics methods 

interface Date{
  daysInMonth(month:number):number;
  monthDiff(d:Date):number;
  dayToDates(days:number[],limit?:number):Date[];
  toYYYYMMDD():string;
  tomorrow():Date;
  plusDays(nb:number):Date;
  in(d1:Date,d2:Date):boolean;
}

interface Array<T>{
  sortSeparatedAlphaNum(separator?:string);
  sortAlphaNum();
}


// Date
// Month is 1 based
Date.prototype.daysInMonth=function(month:number):number {
//var y=this.getFullYear(), m=(month||this.getMonth())
//return /8|3|5|10/.test(m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;

return new Date(this.getFullYear(), (month||this.getMonth())+1, 0).getDate();
};

// the number of months in the difference
// http://stackoverflow.com/questions/2536379/difference-in-months-between-two-dates-in-javascript
Date.prototype.monthDiff=function(d1:Date):number {
var months;
months = (d1.getFullYear() - this.getFullYear()) * 12;
months -= this.getMonth() + 1;
months += d1.getMonth();
return months <= 0 ? 0 : months;
};


//
// give an array of days (in the form [0..6]) and return the ordered dates corresponding (starting from new Date())
// Sun(0), Mon, tuesday, wednesday, thursday, Freeday, Saterday
Date.prototype.dayToDates=function(days?:number[],limit?:number):Date[]{
var now=this, today=now.getDay(), h24=86400000, week=86400000*7, result:any[]=[], potential;    
days=days||[];
days=days.sort(); // sort days in a week

//
// starting from today
days.forEach(function (day,i) {
  if((day-today)>=0) {
    result.push(new Date(now.getTime()+(day-today)*h24));
  }
});

// this is splitted in 2 loops to make the list ordered!
// going to next week  ()
days.forEach(function (day) {
  if((day-today)<0) {
    potential=new Date(now.getTime()+(day-today)*h24+week);
    if(!limit||potential<limit){
      result.push(potential);
    }
  }
});

return result;
};

Date.prototype.toYYYYMMDD=function():string {
return ''+this.getFullYear()+this.getMonth()+this.getDate();
}

Date.prototype.tomorrow=function():Date {
return this.plusDays(1);
}

Date.prototype.plusDays=function(nb:number):Date {
var plus=new Date(this);
plus.setDate(this.getDate()+nb);
return plus;
}

//
// simple test : this in [d1,d2[
Date.prototype.in=function(d1:Date,d2:Date):boolean {
return (this>=d1&&this<d2)
}


//
// http://stackoverflow.com/questions/11887934/how-to-check-if-the-dst-daylight-saving-time-is-in-effect-and-if-it-is-whats
// will tell you whether Daylight Savings Time is in effect.
// Date.prototype.stdTimezoneOffset = function() {
//     var jan = new Date(this.getFullYear(), 0, 1);
//     var jul = new Date(this.getFullYear(), 6, 1);
//     return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
// }

// Date.prototype.dst = function() {
//   return (this.getTimezoneOffset() < this.stdTimezoneOffset())?1:0;
// }
// Object.defineProperty(Array.prototype, "stdTimezoneOffset", { enumerable: false });
// Object.defineProperty(Array.prototype, "dst", { enumerable: false });


//
// label alphanum sort for this case "2000.10"
Array.prototype.sortSeparatedAlphaNum=function (separator?:string) {
separator=separator||'.';

return this.sort(function (a,b) {
  var aA = a.split(separator);
  var bA = b.split(separator);
  // left part
  if(parseInt(aA[0])>parseInt(bA[0])){
    return 1;
  }else
  if(parseInt(aA[0])<parseInt(bA[0])){
    return -1;
  }
  //right part
  if(parseInt(aA[1])>parseInt(bA[1])){
    return 1;
  }else
  if(parseInt(aA[1])<parseInt(bA[1])){
    return -1;
  }
  return 0;
});
};
Object.defineProperty(Array.prototype, "sortSeparatedAlphaNum", { enumerable: false });

//
// simple alpha num sorting
Array.prototype.sortAlphaNum=function () {
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;
return this.sort(function (a,b) {
  var aA = a.replace(reA, "");
  var bA = b.replace(reA, "");
  if(aA === bA) {
      var aN = parseInt(a.replace(reN, ""), 10);
      var bN = parseInt(b.replace(reN, ""), 10);
      return aN === bN ? 0 : aN > bN ? 1 : -1;
  } else {
      return aA > bA ? 1 : -1;
  }
});
};

Object.defineProperty(Array.prototype, "sortAlphaNum", { enumerable: false });

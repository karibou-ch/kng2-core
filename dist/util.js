Date.prototype.daysInMonth = function (month) {
    return new Date(this.getFullYear(), (month || this.getMonth()) + 1, 0).getDate();
};
Date.prototype.monthDiff = function (d1) {
    var months;
    months = (d1.getFullYear() - this.getFullYear()) * 12;
    months -= this.getMonth() + 1;
    months += d1.getMonth();
    return months <= 0 ? 0 : months;
};
Date.prototype.dayToDates = function (days, limit) {
    var now = this, today = now.getDay(), h24 = 86400000, week = 86400000 * 7, result = [], potential;
    days = days || [];
    days = days.sort();
    days.forEach(function (day, i) {
        if ((day - today) >= 0) {
            result.push(new Date(now.getTime() + (day - today) * h24));
        }
    });
    days.forEach(function (day) {
        if ((day - today) < 0) {
            potential = new Date(now.getTime() + (day - today) * h24 + week);
            if (!limit || potential < limit) {
                result.push(potential);
            }
        }
    });
    return result;
};
Date.prototype.toYYYYMMDD = function () {
    return '' + this.getFullYear() + this.getMonth() + this.getDate();
};
Date.prototype.tomorrow = function () {
    return this.plusDays(1);
};
Date.prototype.plusDays = function (nb) {
    var plus = new Date(this);
    plus.setDate(this.getDate() + nb);
    return plus;
};
Date.prototype.in = function (d1, d2) {
    return (this >= d1 && this < d2);
};
Array.prototype.sortSeparatedAlphaNum = function (separator) {
    separator = separator || '.';
    return this.sort(function (a, b) {
        var aA = a.split(separator);
        var bA = b.split(separator);
        if (parseInt(aA[0]) > parseInt(bA[0])) {
            return 1;
        }
        else if (parseInt(aA[0]) < parseInt(bA[0])) {
            return -1;
        }
        if (parseInt(aA[1]) > parseInt(bA[1])) {
            return 1;
        }
        else if (parseInt(aA[1]) < parseInt(bA[1])) {
            return -1;
        }
        return 0;
    });
};
Object.defineProperty(Array.prototype, "sortSeparatedAlphaNum", { enumerable: false });
Array.prototype.sortAlphaNum = function () {
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;
    return this.sort(function (a, b) {
        var aA = a.replace(reA, "");
        var bA = b.replace(reA, "");
        if (aA === bA) {
            var aN = parseInt(a.replace(reN, ""), 10);
            var bN = parseInt(b.replace(reN, ""), 10);
            return aN === bN ? 0 : aN > bN ? 1 : -1;
        }
        else {
            return aA > bA ? 1 : -1;
        }
    });
};
Object.defineProperty(Array.prototype, "sortAlphaNum", { enumerable: false });
//# sourceMappingURL=util.js.map
interface Date {
    daysInMonth(month: number): number;
    monthDiff(d: Date): number;
    dayToDates(days: number[], limit?: number): Date[];
    toYYYYMMDD(): string;
    tomorrow(): Date;
    plusDays(nb: number): Date;
    in(d1: Date, d2: Date): boolean;
}
interface Array<T> {
    sortSeparatedAlphaNum(separator?: string): any;
    sortAlphaNum(): any;
}

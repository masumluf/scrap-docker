let today = new Date();
let day = today.getDate();
let month = today.getMonth();
let year = today.getFullYear();
let lastDay = new Date(year, month + 1, 0).getDate();

let newDate = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
let newMonth =
  today.getMonth() + 1 < 10 ? `0${today.getMonth() + 1}` : today.getMonth() + 1;
let firstDate = `${year}-${newMonth}-${newDate}T00:00:00.00`;
let lastDate = `${year}-${newMonth}-${newDate}T23:59:59.59`;
let firstDayOfTheMonth = new Date(today.getFullYear(), today.getMonth(), 2);

// console.log(day < 10 ? `0${day}` : day)
// console.log(month < 10 ? `0${month}` : month)
// console.log(year)

// console.log(`${year}-${newMonth}-${newDate}`);
//
// console.log(new Date(today));
//
// console.log(firstDate);
// console.log(lastDate);
// console.log("-------");
// console.log(firstDayOfTheMonth);

module.exports = { lastDate, firstDayOfTheMonth, firstDate };

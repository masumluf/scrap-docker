exports.sanitizeDate = (dateValue) => {
  const dateRegex = /(?<today>today)|(?<yesterday>yesterday)|(?<year>\d+\s*years?\s+ago)|(?<month>\d+\s*months?\s+ago)|(?<week>\d+\s*weeks?\s+ago)|(?<day>\d+\s*days?\s+ago)|(?<hour>\d+\s*hours?\s+ago|\d+\s*hrs?\s+ago)|(?<minute>\d+\s*minutes?\s+ago|\d+\s*mins?\s+ago)|(?<second>\d+\s*seconds?\s+ago)/i;
  let newDate = new Date();
  const presentYear = newDate.getFullYear();
  const presentMonth = newDate.getMonth();
  const presentDay = newDate.getDate();
  const presentHour = newDate.getHours();
  const presentMinute = newDate.getMinutes();

  if (dateRegex.test(dateValue)) {
    const matchFormat = dateValue.match(dateRegex).groups;
    if (matchFormat.year) {
      const year = +dateValue.match(/\d+/)[0];
      newDate.setFullYear(presentYear - year);
      return newDate;
    }
    else if (matchFormat.month) {
      const month = +dateValue.match(/\d+/)[0];
      newDate.setMonth(presentMonth - month);
      return newDate;
    }
    else if (matchFormat.week) {
      const week = +dateValue.match(/\d+/)[0];
      newDate.setDate(presentDay - week * 7);
      return newDate;
    }
    else if (matchFormat.day) {
      const day = +dateValue.match(/\d+/)[0];
      newDate.setDate(presentDay - day);
      return newDate;
    }
    else if (matchFormat.hour) {
      const hour = +dateValue.match(/\d+/)[0];
      newDate.setHours(presentHour - hour);
      return newDate;
    }
    else if (matchFormat.minute) {
      const minute = +dateValue.match(/\d+/)[0];
      newDate.setMinutes(presentMinute - minute);
      return newDate;
    }
    else if (matchFormat.today) {
      return newDate;
    }
    else if (matchFormat.yesterday) {
      newDate.setDate(presentDay - 1);
      return newDate;
    }
    else return newDate;
  } else {
    const fullYear = newDate.getFullYear().toString();
    // const shortYear = fullYear.substring(2);
    // const regexDate = new RegExp(`(${fullYear}|${shortYear})$|^(${fullYear})`, "gm");
    const flag = dateValue?.split(" ").length > 2 ||
      dateValue?.split("-").length > 2 ||
      dateValue?.split(".").length > 2;
    if (flag) {
      return new Date(dateValue);
    }
    else {
      return new Date(dateValue+" "+fullYear);
    }
  }
}
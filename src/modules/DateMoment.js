import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import localizedFormat from "dayjs/plugin/localizedFormat";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/ka";
import "dayjs/locale/en";

dayjs.extend(localeData);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(weekday);

export class DateHandler {
   constructor(checkIds, locale = "en") {
      this.checks = checkIds.map((id) => document.getElementById(id));
      this.today = dayjs().locale("en");
      this.locale = locale;
      this.daysOfWeek = [2, 4, 5, 6];
      this.dates = [];
      this.englishDates = [];

      if (this.today.format("dddd") === "Sunday") {
         this.today = this.today.add(1, "week");
      }

      this.generateDates();
      this.fillDOMElements();
   }

   getMonths() {
      return dayjs().locale(this.locale).localeData().months();
   }

   generateDates() {
      for (let i = 0; i < 5; i++) {
         const startDate = this.today.add(i * 7, "day");

         const actualDates = this.daysOfWeek.map((dayIndex) => startDate.weekday(dayIndex)).slice(0, -1);

         const localeDates = actualDates.map((date) => date.locale(this.locale).format("MMMM D"));

         const englishDates = actualDates.map((date) => date.locale("en").format("MMMM D"));

         const [localeMonth] = localeDates[0].split(" ");
         const localeDaysOnly = localeDates.map((date) => date.split(" ")[1]);
         const localeFormattedString = `${localeMonth} ${localeDaysOnly.join("-")}`;

         const [englishMonth] = englishDates[0].split(" ");
         const englishDaysOnly = englishDates.map((date) => date.split(" ")[1]);
         const englishFormattedString = `${englishMonth} ${englishDaysOnly.join("-")}`;

         this.dates.push(localeFormattedString);
         this.englishDates.push(englishFormattedString);
      }
   }

   fillDOMElements() {
      this.checks.forEach((check, index) => {
         if (check && this.dates[index + 1]) {
            check.innerHTML = this.dates[index + 1];
            check.value = this.englishDates[index + 1];

            const label = document.querySelector(`label[for="${check.id}"] + label`);
            if (label) {
               label.innerHTML = this.dates[index + 1];
            }
         }
      });
   }
}

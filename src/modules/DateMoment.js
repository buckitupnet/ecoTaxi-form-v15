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
      this.today = dayjs().locale(locale);
      this.locale = locale;
      this.daysOfWeek = [2, 4, 5, 6];
      this.dates = [];

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
         const formattedDates = this.daysOfWeek.map((dayIndex) => startDate.weekday(dayIndex).format("MMMM D")).slice(0, -1);

         const [month] = formattedDates[0].split(" ");
         const daysOnly = formattedDates.map((date) => date.split(" ")[1]);
         const formattedString = `${month} ${daysOnly.join("-")}`;

         this.dates.push(formattedString);
      }
   }

   fillDOMElements() {
      this.checks.forEach((check, index) => {
         if (check && this.dates[index + 1]) {
            check.innerHTML = this.dates[index + 1];
            check.value = this.dates[index + 1];

            const label = document.querySelector(`label[for="${check.id}"] + label`);
            if (label) {
               label.innerHTML = this.dates[index + 1];
            }
         }
      });
   }
}

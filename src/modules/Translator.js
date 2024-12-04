import en from "../locales/en.json";
import ka from "../locales/ka.json";
import { I18n } from "i18n-js";

export class Translator {
   constructor() {
      this.i18n = new I18n({ ...en, ...ka });
      this.storage = localStorage.getItem("appLocale");
      this.i18n.defaultLocale = "en";
      this.i18n.locale = this.storage || "en";

      this.init();
   }

   init() {
      const select = document.getElementById("languageSelect");
      this.updateTranslations();
      if (select) select.addEventListener("change", this.handleLanguageChange.bind(this));
   }

   handleLanguageChange(event) {
      const newLocale = event.target.value;
      this.i18n.locale = newLocale;

      localStorage.setItem("appLocale", newLocale);
      window.location.reload();
   }

   updateTranslations() {
      document.querySelectorAll("[data-lang], [data-lang-placeholder]").forEach((element) => {
         const translationKey = element.getAttribute("data-lang");
         const placeholderKey = element.getAttribute("data-lang-placeholder");

         if (placeholderKey) {
            element.setAttribute("placeholder", this.i18n.t(placeholderKey));
         }

         if (translationKey) {
            element.innerHTML = this.i18n.t(translationKey);
         }
      });
   }
}

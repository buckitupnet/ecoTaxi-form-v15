import "./index.scss";

import Choices from "choices.js";
import intlTelInput from "intl-tel-input";

import { CONFIG } from "../config";

import { DateHandler } from "./modules/DateMoment";
import { TbilisiMap } from "./modules/TbilisiMap";
import { Translator } from "./modules/Translator";
import { EncryptionManager } from "./modules/EncryptionManager";
import { EcoTaxiFormHandler } from "./modules/EcoTaxiFormHandler";
import { CheckboxFormHandler } from "./modules/CheckboxFormHandler";
import { TariffSelector } from "./modules/TariffSelector";
import { FormAutoFiller } from "./modules/FormAutoFill";
import { EventHandlers } from "./modules/Authorization";
import { Chat } from "./modules/Chat";

const instansEncryptionManager = new EncryptionManager();
const translator = new Translator();
new EventHandlers(instansEncryptionManager);
new EcoTaxiFormHandler(CONFIG.BASE_URL, CONFIG.BOARD, CONFIG.MAIN_KEY, CONFIG.ADMIN_KEY, instansEncryptionManager);
new DateHandler(["check-1", "check-2", "check-3", "check-4"], translator.i18n.locale);
new TbilisiMap(CONFIG.GOOGLE_KEY);
new Chat(CONFIG.BASE_URL, CONFIG.ADMIN_KEY, instansEncryptionManager);
new CheckboxFormHandler();

const languageSelect = new Choices("#languageSelect", {
   searchEnabled: false,
   placeholder: true,
   placeholderValue: translator.i18n.t("languageSelect"),
   classNames: {
      containerOuter: "select-lang",
      containerInner: "select-inner",
      list: "select-list",
      item: "select-item",
      placeholder: "select-placeholder",
      itemChoice: "select-choice",
   },
});

const areaSelect = new Choices("#areaSelect", {
   searchEnabled: true,
   placeholder: true,
   placeholderValue: translator.i18n.t("areaSelect.placeholder"),
   searchPlaceholderValue: translator.i18n.t("areaSelect.searchPlaceholder"),
   classNames: {
      containerOuter: "select-area",
      containerInner: "select-inner",
      list: "select-list",
      item: "select-item",
      placeholder: "select-placeholder",
      itemChoice: "select-choice",
   },
});

const langSelect = new Choices("#langSelect", {
   searchEnabled: false,
   placeholder: true,
   removeItemButton: true,
   removeItemIconText: "×",
   searchChoices: false,
   placeholderValue: translator.i18n.t("langSelect"),
   classNames: {
      containerOuter: "select-langs",
      containerInner: "select-inner",
      list: "select-list",
      item: "select-item",
      placeholder: "select-placeholder",
      itemChoice: "select-choice",
   },
});

const tariffSelect = new Choices("#tariffSelect", {
   searchEnabled: false,
   placeholder: true,
   placeholderValue: translator.i18n.t("tariffSelect"),
   classNames: {
      containerOuter: "select-tariff",
      containerInner: "select-inner",
      list: "select-list",
      item: "select-item",
      placeholder: "select-placeholder",
      itemChoice: "select-choice",
   },
});

const paymentSelect = new Choices("#paymentSelect", {
   searchEnabled: false,
   placeholder: true,
   placeholderValue: translator.i18n.t("paymentSelect"),
   classNames: {
      containerOuter: "select-payment",
      containerInner: "select-inner",
      list: "select-list",
      item: "select-item",
      placeholder: "select-placeholder",
      itemChoice: "select-choice",
   },
});

new TariffSelector("areaSelect", tariffSelect);
new FormAutoFiller(
   CONFIG.BASE_URL,
   { area: areaSelect, language: langSelect, tariff: tariffSelect, payment: paymentSelect },
   instansEncryptionManager,
);

const input = document.getElementById("intlTelInput");
const hiddenCountryCodeInput = document.querySelector('input[name="countryCode"]');

const options = {
   initialCountry: "ge",
   strictMode: true,
   useFullscreenPopup: false,
   autoPlaceholder: "aggressive",
   nationalMode: false,
   separateDialCode: true,
   loadUtils: () => import("intl-tel-input/utils"),
};

const iti = intlTelInput(input, options);

const updateCountryCode = () => {
   const countryData = iti.getSelectedCountryData();
   if (countryData && countryData.iso2) {
      hiddenCountryCodeInput.value = countryData.iso2.toUpperCase();
   }
};

updateCountryCode();

input.addEventListener("countrychange", updateCountryCode);

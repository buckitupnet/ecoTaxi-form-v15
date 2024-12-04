export class TariffSelector {
   /**
    * Создает экземпляр класса TariffSelector.
    * @param {string} areaSelectId - ID выпадающего списка выбора области.
    * @param {object} tariffChoicesInstance - Экземпляр Choices.js для управления тарифами.
    */
   constructor(areaSelectId, tariffChoicesInstance) {
      this.areaSelect = document.getElementById(areaSelectId);
      this.tariffChoicesInstance = tariffChoicesInstance;

      this.#init();
   }

   /** Инициализирует обработчики событий. */
   #init() {
      this.areaSelect.addEventListener("change", () => this.#updateTariff());
   }

   /** Обновляет выбранный тариф в зависимости от выбранной области. */
   #updateTariff() {
      const selectedOption = this.areaSelect.options[this.areaSelect.selectedIndex];
      const areaType = selectedOption.getAttribute("data-area");

      if (areaType) {
         const targetValue = this.#getTargetValue(areaType);
         if (targetValue) {
            this.#selectTariff(targetValue);
         }
      }
   }

   /**
    * Возвращает значение тарифа в зависимости от типа области.
    * @param {string} areaType - Тип области (central, remote, suburb).
    * @returns {string|null} Значение тарифа или null, если тип области неизвестен.
    */
   #getTargetValue(areaType) {
      switch (areaType) {
         case "central":
            return "25 GEL - Basic Tariff Central";
         case "remote":
            return "30 GEL - Basic Tariff Remote";
         case "suburb":
            return "35 GEL - Basic Tariff Suburbs";
         default:
            return null;
      }
   }

   /**
    * Устанавливает выбранный тариф в Choices.js.
    * @param {string} targetValue - Значение тарифа, которое нужно выбрать.
    */
   #selectTariff(targetValue) {
      const options = this.tariffChoicesInstance._store.choices;
      const targetOption = options.find((option) => option.value === targetValue);

      if (targetOption) {
         this.tariffChoicesInstance.setChoiceByValue(targetValue);
      }
   }
}

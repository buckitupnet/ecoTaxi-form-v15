export class TariffSelector {
   /**
    * Creates an instance of the TariffSelector class.
    * @param {string} areaSelectId - The ID of the area selection dropdown.
    * @param {object} tariffChoicesInstance - An instance of Choices.js for managing tariffs.
    */
   constructor(areaSelectId, tariffChoicesInstance) {
      this.areaSelect = document.getElementById(areaSelectId);
      this.tariffChoicesInstance = tariffChoicesInstance;

      this.#init();
   }

   /** Initializes event handlers. */
   #init() {
      this.areaSelect.addEventListener("change", () => this.#updateTariff());
   }

   /** Updates the selected tariff based on the selected area. */
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
    * Returns the tariff value based on the area type.
    * @param {string} areaType - The type of the area (central, remote, suburb).
    * @returns {string|null} The tariff value or null if the area type is unknown.
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
    * Sets the selected tariff in Choices.js.
    * @param {string} targetValue - The tariff value to select.
    */
   #selectTariff(targetValue) {
      const options = this.tariffChoicesInstance._store.choices;
      const targetOption = options.find((option) => option.value === targetValue);

      if (targetOption) {
         this.tariffChoicesInstance.setChoiceByValue(targetValue);
      }
   }
}

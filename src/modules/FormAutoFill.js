import { EcoTaxi } from "./EcoTaxi";

export class FormAutoFiller {
   constructor(baseUrl, choicesInstances, encryptionInstance) {
      this.ecoTaxi = new EcoTaxi(baseUrl);
      this.encryptionManager = encryptionInstance;
      this.choicesInstances = choicesInstances;
      this.#localStorageKey = "ecoTaxiFormData";
      this.init();
   }

   #localStorageKey;

   async init() {
      const savedData = this.loadLocalData();
      const hasVault = await this.encryptionManager.hasVault();

      this.encryptionManager.addEventListener("authChange", async (e) => {
         const { isAuth } = e.detail;
         if (isAuth) {
            const savedData = await this.encryptionManager.getData();
            const parsedData = JSON.parse(savedData || "{}");
            this.updateMessageLink(parsedData.userName || "No name");
         }
      });

      hasVault ? await this.loadEncryptedData() : await this.handleDataMigration(savedData);
      localStorage.removeItem(this.#localStorageKey);
   }

   async handleDataMigration(savedData) {
      if (savedData?.userData) {
         this.fillForm(savedData.userData);
         await this.encryptionManager.setData(JSON.stringify(savedData));
      }
   }

   async loadEncryptedData() {
      const encryptedData = await this.encryptionManager.getData();

      if (encryptedData) {
         const parsedData = JSON.parse(encryptedData);

         if (parsedData?.userData) this.fillForm(parsedData.userData);
         if (parsedData?.userName) this.updateMessageLink(parsedData.userName);
      }
   }

   updateMessageLink(name) {
      const messageLink = document.getElementById("isMessage");
      const messageName = messageLink.querySelector("#name");
      messageLink.classList.remove("hidden");
      messageLink.classList.add("flex");
      messageName.textContent = name;
   }

   loadLocalData() {
      const jsonData = localStorage.getItem(this.#localStorageKey);
      return jsonData ? JSON.parse(jsonData) : null;
   }

   fillForm(data) {
      Object.entries(data).forEach(([key, value]) => {
         this.fillFormField(key, value);
         this.fillCheckbox(key, value);
      });
   }

   fillFormField(name, value) {
      const form = document.getElementById("form");
      const field = form?.querySelector(`[name="${name}"]`);
      if (!field) return;

      const choicesInstance = this.choicesInstances?.[name];

      if (choicesInstance) {
         if (Array.isArray(value)) {
            value.forEach((targetValue) => {
               if (targetValue) {
                  const options = choicesInstance._store.choices;
                  const targetOption = options.find((option) => option.value === targetValue);

                  if (targetOption) {
                     choicesInstance.setChoiceByValue(targetValue);
                  }
               }
            });
         } else if (value) {
            const options = choicesInstance._store.choices;
            const targetOption = options.find((option) => option.value === value);

            if (targetOption) {
               choicesInstance.setChoiceByValue(value);
            }
         }
         return;
      }
      switch (field.type) {
         case "checkbox":
            field.checked = Boolean(value);
            break;
         case "file":
            break;
         default:
            field.value = value;
            break;
      }
   }

   fillCheckbox(key, value) {
      const checkbox = document.getElementById(key);
      if (checkbox?.type === "checkbox") checkbox.checked = Boolean(value);
   }
}

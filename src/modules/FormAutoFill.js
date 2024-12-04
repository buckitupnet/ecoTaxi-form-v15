import { EcoTaxi } from "./EcoTaxi";

export class FormAutoFiller {
   constructor(baseUrl, choicesInstances, encryptionInstance) {
      this.form = document.getElementById("form");
      this.localStorageKey = "ecoTaxiFormData";
      this.encryptionManager = encryptionInstance;
      this.ecoTaxi = new EcoTaxi(baseUrl);
      this.choicesInstances = choicesInstances;
      this.init();
   }

   async init() {
      const savedData = this.loadLocalData();
      const hasVault = await this.encryptionManager.hasVault();

      if (savedData && !hasVault) {
         await this.handleDataMigration(savedData);
      }

      if (savedData && hasVault) {
         await this.handleDataMigration(savedData);
      }

      if (hasVault) {
         await this.loadEncryptedData();
      }

      localStorage.removeItem(this.localStorageKey);
   }

   async handleDataMigration(savedData) {
      try {
         this.fillForm(savedData.data);

         const combinedData = {
            userName: savedData.data.name,
            userKeipair: { privateKey: savedData.privateKey, publicKey: savedData.publicKey },
            userData: savedData.data,
         };

         const stringifiedData = JSON.stringify(combinedData);
         await this.encryptionManager.setData(stringifiedData);

         this.updateMessageLink(savedData.data.name);
      } catch (error) {
         console.error("Ошибка при переносе данных в зашифрованное хранилище:", error);
      } finally {
      }
   }

   async loadEncryptedData() {
      const encryptedData = await this.encryptionManager.getData();

      if (encryptedData) {
         const parsedData = JSON.parse(encryptedData);
         if (parsedData?.userData) this.fillForm(parsedData.userData);
         if (parsedData?.userData?.name) this.updateMessageLink(parsedData.userData.name);
      }
   }

   updateMessageLink(name) {
      const messageLink = document.getElementById("isMessage");
      if (messageLink) {
         const messageName = messageLink.querySelector("#name");
         messageLink.classList.remove("hidden");
         messageLink.classList.add("flex");
         messageName.textContent = name;
      }
   }

   loadLocalData() {
      try {
         const savedData = localStorage.getItem(this.localStorageKey);
         return savedData ? JSON.parse(savedData) : null;
      } catch (error) {
         console.error("Ошибка загрузки данных из localStorage:", error);
         return null;
      }
   }

   fillForm(data) {
      Object.entries(data).forEach(([key, value]) => {
         this.fillFormField(key, value);
         this.fillCheckbox(key, value);
      });
   }

   fillFormField(name, value) {
      const field = this.form.querySelector(`[name="${name}"]`);
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

import { EcoTaxi } from "./EcoTaxi";

class FormManager {
   static validateRecaptcha() {
      const recaptchaResponse = grecaptcha.getResponse();
      return recaptchaResponse.length ? true : false;
   }

   static validateCheckedDates(formData) {
      const dateFields = ["check-1", "check-2", "check-3", "check-4"];
      return dateFields.some((check) => formData[check]?.trim());
   }

   static validateFields(formData) {
      const requiredFields = ["area", "tariff", "payment", "language"];
      return requiredFields.every((field) => {
         const value = formData[field];
         if (Array.isArray(value)) {
            return value.length > 0;
         }
         return value?.trim();
      });
   }

   static collectCheckedDates(formData) {
      const dateFields = ["check-1", "check-2", "check-3", "check-4"];
      return dateFields.filter((field) => formData.get(field)).map((field) => formData.get(field));
   }

   static extractFormData(formData) {
      const data = {};
      formData.forEach((value, key) => {
         if (key === "language") {
            if (!data[key]) {
               data[key] = [];
            }
            data[key].push(value);
         } else {
            data[key] = value;
         }
      });
      return data;
   }
}

class LocalStorageManager {
   static saveDate(key, value) {
      const jsonData = JSON.stringify(value);
      localStorage.setItem(key, jsonData);
   }

   static loadDate(key) {
      const jsonData = localStorage.getItem(key);
      return jsonData ? JSON.parse(jsonData) : null;
   }
}

export class EcoTaxiFormHandler {
   constructor(baseUrl, board, key, adminkey, encryptionInstance) {
      this.ecoTaxi = new EcoTaxi(baseUrl);
      this.board = board;
      this.key = key;
      this.adminkey = adminkey;
      this.encryptionManager = encryptionInstance;
      this.#userKeipair = null;
      this.#localStorageKey = "ecoTaxiFormData";

      this.init();
   }

   #userKeipair;
   #localStorageKey;

   init() {
      const form = document.getElementById("form");
      if (form) form.addEventListener("submit", this);
      window.onSubmit = this.handleEvent.bind(this);
   }

   handleEvent(event) {
      event.preventDefault();

      const formData = new FormData(event.target);
      const data = FormManager.extractFormData(formData);
      const dates = FormManager.collectCheckedDates(formData);
      const isDateValid = FormManager.validateCheckedDates(data);
      const isSelectValid = FormManager.validateFields(data);
      const isCaptchaValid = FormManager.validateRecaptcha();

      if (!isDateValid) {
         this.showErrorMessage("Please provide at least one date in the check fields.");
         return;
      }

      if (!isSelectValid) {
         this.showErrorMessage("Please fill in all required selects.");
         return;
      }

      if (data.read !== "on") {
         this.showErrorMessage("Please accept the sorting guidelines.");
         return;
      }

      if (!isCaptchaValid) {
         this.showErrorMessage("Please complete the recaptcha.");
         return;
      }

      this.sendFormData(data, dates);
   }

   async sendFormData(data, dates) {
      const btn = document.getElementById("sendBtn");
      try {
         btn.disabled = true;
         const hasVault = await this.encryptionManager.hasVault();

         if (!hasVault) {
            this.#userKeipair = this.ecoTaxi.generateUserKeypair();
            await this.ecoTaxi.registerUser(data.name, this.#userKeipair);
            data.chat = this.ecoTaxi.buildUserLink(this.#userKeipair);
            await this.ecoTaxi.sendMessage(this.#userKeipair, this.adminkey, this.generateText(data, dates));

            LocalStorageManager.saveDate(this.#localStorageKey, {
               userName: data.name,
               userKeipair: { privateKey: this.#userKeipair.privateKey, publicKey: this.#userKeipair.publicKey },
               userData: data,
            });
         }

         if (hasVault && !this.encryptionManager.isAuth) {
            this.#userKeipair = this.ecoTaxi.generateUserKeypair();
            await this.ecoTaxi.registerUser(data.name, this.#userKeipair);
            await this.ecoTaxi.sendMessage(this.#userKeipair, this.adminkey, this.generateText(data, dates));

            LocalStorageManager.saveDate(this.#localStorageKey, {
               userName: data.name,
               userKeipair: { privateKey: this.#userKeipair.privateKey, publicKey: this.#userKeipair.publicKey },
               userData: data,
            });
         }

         if (hasVault && this.encryptionManager.isAuth) {
            const encryptedData = await this.encryptionManager.getData();
            const parsedData = JSON.parse(encryptedData);

            if (parsedData?.userData) {
               parsedData.userData = { ...parsedData.userData, ...data };
               this.#userKeipair = parsedData.userKeipair;
               await this.ecoTaxi.sendMessage(this.#userKeipair, this.adminkey, this.generateText(data, dates));
               const updatedData = JSON.stringify(parsedData);
               await this.encryptionManager.setData(updatedData);
            } else {
               const parsedData = JSON.parse(encryptedData);
               this.#userKeipair = parsedData.userKeipair;
               await this.ecoTaxi.sendMessage(this.#userKeipair, this.adminkey, this.generateText(data, dates));
               const updatedData = JSON.stringify({ userData: data, userKeipair: this.#userKeipair, userName: data.name });
               await this.encryptionManager.setData(updatedData);
            }
         }

         const values = this.prepareRequestPayload(data, dates);

         let result;
         const response = await this.sendMonday(values);
         result = await response.json();

         if (data && data.file && data.file.size > 0) {
            try {
               await this.uploadFileMonday(result.data.create_item.id, data.file);
            } catch (error) {
               console.error("Ошибка при загрузке файла:", error);
               throw new Error("Не удалось загрузить файл.");
            }
         }

         this.openModal();
      } catch (error) {
         console.error("Ошибка при обработке формы:", error);
      } finally {
         btn.disabled = false;
         grecaptcha.reset();
      }
   }

   async sendMonday(values) {
      return await fetch("https://api.monday.com/v2", {
         method: "post",
         headers: {
            "Content-Type": "application/json",
            "Authorization": this.key,
         },
         body: JSON.stringify({
            query: `
                       mutation ($myItemName: String!, $columnVals: JSON!) {
                           create_item (board_id: ${this.board}, item_name: $myItemName, column_values: $columnVals) {
                               id
                           }
                       }
                   `,
            variables: values,
         }),
      });
   }

   async uploadFileMonday(itemId, file) {
      const formData = new FormData();
      formData.append(
         "query",
         `
            mutation ($file: File!) {
                add_file_to_column (item_id: ${itemId}, column_id: "files", file: $file) {
                    id
                }
            }
        `,
      );
      formData.append("variables[file]", file);

      const fileResponse = await fetch("https://api.monday.com/v2/", {
         method: "POST",
         headers: {
            Authorization: this.key,
         },
         body: formData,
      });

      const fileResult = await fileResponse.json();
      console.log("Ответ сервера при загрузке файла:", fileResult);
   }

   generateText(data, dates) {
      return [
         `Date: ${dates.join(", ")}`,
         `Language: ${data.language.join(", ") || ""}`,
         `Email: ${data.email || ""}`,
         `Phone: ${data.phone || ""}`,
         `Area: ${data.area || ""}`,
         `Address: ${data.address || ""}`,
         `Quantity: ${data.quantity || ""}`,
         `Tariff: ${data.tariff || ""}`,
         data["check-5"] ? "Saturday ready" : "",
         `Promo Code: ${data.promoCode || ""}`,
         `Comment: ${data.comment || ""}`,
         `Location: ${data.link}`,
      ]
         .filter(Boolean)
         .join("\n\n");
   }

   prepareRequestPayload(data, dates) {
      return {
         myItemName: data.name,
         columnVals: JSON.stringify({
            dup__of_name: data.address,
            email0: data.email,
            phone: {
               phone: data.phone.replace(/\s/g, ""),
               countryShortName: data.countryCode,
            },
            dropdown: data.area,
            dropdown0: data.language.join(", "),
            dup__of_language: data.tariff,
            dup__of_tariff: data.payment,
            text9: data.comment,
            text3: data.quantity,
            text0: dates.join(", "),
            text05: data["check-5"] === "on" ? "true" : "",
            location0: data.link, //Сслыка карты google
            _____: data.chat, // Ссылка на чат
         }),
      };
   }

   showErrorMessage(message) {
      const errorElement = document.getElementById("error");
      errorElement.innerText = message;
      errorElement?.classList.remove("hidden");

      setTimeout(() => {
         errorElement?.classList.add("hidden");
      }, 2500);
   }

   openModal() {
      const modal = document.getElementById("modal");
      const body = document.querySelector("body");
      modal?.classList.remove("hidden");
      body?.classList.add("overflow-hidden");
   }
}

import { EcoTaxi } from "./EcoTaxi";

export class EcoTaxiFormHandler {
   constructor(baseUrl, board, key, adminkey, encryptionInstance) {
      this.baseUrl = baseUrl;
      this.board = board;
      this.key = key;
      this.adminkey = adminkey;
      this.userKeipair = null;
      this.encryptionManager = encryptionInstance;
      this.ecoTaxi = new EcoTaxi(baseUrl);
      this.init();
   }

   init() {
      const form = document.getElementById("form");
      if (form) form.addEventListener("submit", this.handleEvent.bind(this));
      window.onSubmit = this.handleEvent.bind(this);
   }

   handleEvent(event) {
      event.preventDefault();

      const form = event.target;
      const formData = new FormData(form);
      const dates = this.collectCheckedDates(formData);
      const data = this.extractFormData(formData);

      if (!this.validateRecaptcha()) return;
      this.sendData(data, dates);
   }

   collectCheckedDates(formData) {
      const dateFields = ["check-1", "check-2", "check-3", "check-4"];
      const values = dateFields.filter((field) => formData.get(field)).map((field) => formData.get(field));
      return values;
   }

   extractFormData(formData) {
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

   validateRecaptcha() {
      const recaptchaResponse = grecaptcha.getResponse();
      if (!recaptchaResponse.length) {
         console.error("Пожалуйста, пройдите проверку капчи.");
         return false;
      }
      return true;
   }

   openModal() {
      const modal = document.getElementById("modal");
      const body = document.querySelector("body");
      modal?.classList.remove("hidden");
      body?.classList.add("overflow-hidden");
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

   saveToLocalStorage(key, value) {
      try {
         const jsonData = JSON.stringify(value);
         localStorage.setItem(key, jsonData);
         console.log(`Данные успешно сохранены в localStorage под ключом "${key}".`);
      } catch (error) {
         console.error("Ошибка при сохранении данных в localStorage:", error);
      }
   }

   loadFromLocalStorage(key) {
      try {
         const jsonData = localStorage.getItem(key);
         if (!jsonData) {
            console.warn(`Данные с ключом "${key}" отсутствуют в localStorage.`);
            return null;
         }
         return JSON.parse(jsonData);
      } catch (error) {
         console.error("Ошибка при загрузке данных из localStorage:", error);
         return null;
      }
   }

   async sendData(data, dates) {
      const btn = document.getElementById("sendBtn");
      try {
         btn.disabled = true;
         const localStorageKey = "ecoTaxiFormData";
         const text = this.generateText(data, dates);

         const hasVault = await this.encryptionManager.hasVault();

         if (hasVault && !this.encryptionManager.isAuth) {
            this.userKeipair = this.ecoTaxi.generateUserKeypair();

            // Регистрируем пользователя
            await this.ecoTaxi.registerUser(data.name, this.userKeipair);

            // Отправляем сообщение
            await this.ecoTaxi.sendMessage(this.userKeipair, this.adminkey, text);

            // Сохраняем данные в локальное хранилище
            this.saveToLocalStorage(localStorageKey, { data, ...this.userKeipair });
         }

         if (!hasVault) {
            // Сохраняем данные только в незашифрованное хранилище
            this.userKeipair = this.ecoTaxi.generateUserKeypair();

            // Регистрируем пользователя
            await this.ecoTaxi.registerUser(data.name, this.userKeipair);

            // Генерируем ссылку и добавляем в данные
            const link = this.ecoTaxi.buildUserLink(this.userKeipair);
            data.chat = link;

            // Отправляем сообщение
            await this.ecoTaxi.sendMessage(this.userKeipair, this.adminkey, text);

            // Сохраняем данные в локальное хранилище
            this.saveToLocalStorage(localStorageKey, { data, ...this.userKeipair });
         }

         if (hasVault && this.encryptionManager.isAuth) {
            // Работаем с зашифрованным хранилищем
            const encryptedData = await this.encryptionManager.getData();

            if (encryptedData) {
               const parsedData = JSON.parse(encryptedData);

               if (parsedData.userData) {
                  // Обновляем данные пользователя
                  parsedData.userData = { ...parsedData.userData, ...data };

                  // Отправляем сообщение
                  this.userKeipair = parsedData.userKeipair;

                  await this.ecoTaxi.sendMessage(this.userKeipair, this.adminkey, text);
                  // Сохраняем обновленные данные в зашифрованное хранилище
                  const updatedData = JSON.stringify(parsedData);
                  await this.encryptionManager.setData(updatedData);
               } else {
                  const parsedData = JSON.parse(encryptedData);

                  this.userKeipair = JSON.parse(parsedData.userKeipair);

                  await this.ecoTaxi.sendMessage(this.userKeipair, this.adminkey, text);

                  const updatedData = JSON.stringify({ userData: data, userKeipair: this.userKeipair });
                  await this.encryptionManager.setData(updatedData);
               }

               console.log("Данные обновлены в зашифрованном хранилище.");
            } else {
               console.warn("Не удалось найти данные в зашифрованном хранилище.");
            }
         }

         const values = this.prepareRequestPayload(data, dates);

         // 5. Отправка данных в Monday.com API
         let result;
         // const response = await this.sendMonday(values);
         // result = await response.json();

         // 7. Загрузка файла, если он указан
         // if (data && data.file && data.file.size > 0) {
         //    try {
         //       await this.uploadFileMonday(result.data.create_item.id, data.file);
         //    } catch (error) {
         //       console.error("Ошибка при загрузке файла:", error);
         //       throw new Error("Не удалось загрузить файл.");
         //    }
         // }

         // 8. Открытие модального окна
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
}

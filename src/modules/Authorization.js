import { Enigma } from "./Enigma";

export class Authorization {
   constructor(encryptionManager) {
      this.enigma = new Enigma();
      this.encryptionManager = encryptionManager;
      this.init();
   }

   init() {
      const modalAuth = document.getElementById("modalAuth");
      const popupButtonLogin = document.querySelector("#popupButtonLogin");
      const popupButtonLogout = document.querySelector("#popupButtonLogout");

      const contentLogin = document.querySelector("#contentLogin");
      const contentLogout = document.querySelector("#contentLogout");
      const contentLoginPassword = document.querySelector("#contentLoginPassword");
      const contentLogoutPassword = document.querySelector("#contentLogoutPassword");

      const downloadKeysButton = document.querySelector("#downloadKeysButton");
      const logoutWithoutKeysButton = document.querySelector("#logoutWithoutKeysButton");

      const encryptionPasswordInputLogin = document.querySelector("#encryptionPasswordInputLogin");
      const encryptionPasswordInputLogout = document.querySelector("#encryptionPasswordInputLogout");
      const confirmImportButton = document.querySelector("#confirmImportButton");
      const confirmImportButtonInput = document.querySelector("#confirmImportButton input");

      const confirmDownloadButton = document.querySelector("#confirmDownloadButton");

      const importKeysButton = document.querySelector("#importKeysButton");
      const closeModalButton = document.querySelectorAll(".closeModalButton");

      modalAuth?.addEventListener("click", (event) => {
         if (event.target.classList.contains("modalContent")) {
            this.closeModal();
         }
      });

      popupButtonLogin?.addEventListener("click", () => {
         this.openModal();
         this.openModalContentLogin();
      });

      popupButtonLogout?.addEventListener("click", () => {
         this.openModal();
         this.openModalContentLogout();
      });

      closeModalButton.forEach((item) => {
         item.addEventListener("click", () => {
            this.closeModal();
         });
      });

      importKeysButton?.addEventListener("click", () => {
         contentLogin?.classList.add("hidden");
         contentLoginPassword?.classList.remove("hidden");
      });

      downloadKeysButton?.addEventListener("click", () => {
         contentLogout?.classList.add("hidden");
         contentLogoutPassword?.classList.remove("hidden");
      });

      logoutWithoutKeysButton?.addEventListener("click", () => {
         this.logoutWithoutKeys();
      });

      encryptionPasswordInputLogin?.addEventListener("input", (e) => {
         const isValid = e.currentTarget.value.length >= 12;

         if (isValid) {
            confirmImportButtonInput.disabled = false;
            confirmImportButton?.classList.remove("opacity-50", "cursor-not-allowed");
            confirmImportButton?.classList.add("cursor-pointer");
         } else {
            confirmImportButtonInput.disabled = true;
            confirmImportButton?.classList.add("opacity-50", "cursor-not-allowed");
            confirmImportButton?.classList.remove("cursor-pointer");
         }
      });

      encryptionPasswordInputLogout?.addEventListener("input", (e) => {
         const isValid = e.currentTarget.value.length >= 12;

         if (isValid) {
            confirmDownloadButton.disabled = false;
         } else {
            confirmDownloadButton.disabled = true;
         }
      });

      confirmImportButton?.addEventListener("change", async (e) => {
         const file = e.target.files[0];
         const password = encryptionPasswordInputLogin.value;
         const res = await this.loadEncryptedDataFromFile(file, password);
         this.encryptionManager.setData(JSON.stringify({ userKeipair: JSON.parse(res) }));
         this.closeModal();
      });

      confirmDownloadButton?.addEventListener("click", async () => {
         const data = await this.encryptionManager.getData();
         const stringifiedData = JSON.parse(data).userKeipair;
         await this.saveEncryptedDataToFile(stringifiedData, encryptionPasswordInputLogout.value);
         this.closeModal();
         this.encryptionManager.clearVault();
      });

      this.encryptionManager.addEventListener("authChange", (e) => {
         const { isAuth } = e.detail;

         if (isAuth) {
            popupButtonLogin?.classList.remove("flex");
            popupButtonLogin?.classList.add("hidden");

            popupButtonLogout?.classList.remove("hidden");
            popupButtonLogout?.classList.add("flex");
         } else {
            popupButtonLogin?.classList.add("flex");
            popupButtonLogin?.classList.remove("hidden");

            popupButtonLogout?.classList.add("hidden");
            popupButtonLogout?.classList.remove("flex");
         }
      });
   }

   openModal() {
      const body = document.querySelector("body");
      const modalAuth = document.querySelector("#modalAuth");
      modalAuth?.classList.remove("hidden");
      body?.classList.add("overflow-hidden");
   }

   closeModal() {
      const body = document.querySelector("body");
      const modalAuth = document.querySelector("#modalAuth");
      modalAuth?.classList.add("hidden");
      body?.classList.remove("overflow-hidden");
      this.closeModalContentLogin();
      this.closeModalContentLogout();
      this.closeContentLoginPassword();
      this.closeContentLogoutPassword();
   }

   openModalContentLogin() {
      const loginContent = document.querySelector("#contentLogin");
      loginContent?.classList.remove("hidden");
   }

   openModalContentLogout() {
      const logoutContent = document.querySelector("#contentLogout");
      logoutContent?.classList.remove("hidden");
   }

   closeModalContentLogin() {
      const loginContent = document.querySelector("#contentLogin");
      loginContent?.classList.add("hidden");
   }

   closeModalContentLogout() {
      const logoutContent = document.querySelector("#contentLogout");
      logoutContent?.classList.add("hidden");
   }

   closeContentLoginPassword() {
      const contentLoginPassword = document.querySelector("#contentLoginPassword");
      contentLoginPassword?.classList.add("hidden");
   }

   closeContentLogoutPassword() {
      const contentLogoutPassword = document.querySelector("#contentLogoutPassword");
      contentLogoutPassword?.classList.add("hidden");
   }

   async logoutWithoutKeys() {
      await this.encryptionManager.clearVault();
      this.closeModal();
   }

   async saveEncryptedDataToFile(data, password) {
      try {
         // Конвертируем объект в строку JSON
         const jsonData = JSON.stringify(data);

         // Конвертируем строку JSON в Base64
         const base64Data = this.enigma.stringToBase64(jsonData);

         // Конвертируем пароль в Base64
         const base64Password = this.enigma.stringToBase64(password);

         // Шифруем данные
         const encryptedDataBase64 = this.enigma.encryptData(base64Data, base64Password);

         // Преобразуем зашифрованные данные в массив байтов
         const encryptedDataArray = this.enigma.base64ToArray(encryptedDataBase64);

         // Создаем бинарный файл из зашифрованных данных
         const blob = new Blob([encryptedDataArray], { type: "application/octet-stream" });

         // Инициируем скачивание файла
         const link = document.createElement("a");
         link.href = URL.createObjectURL(blob);
         link.download = "vault.data";
         link.click();

         // Очищаем временный URL
         URL.revokeObjectURL(link.href);
      } catch (error) {
         console.error("Ошибка при сохранении зашифрованных данных:", error);
      }
   }

   async loadEncryptedDataFromFile(file, password) {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();

         reader.onload = async (event) => {
            try {
               // Преобразуем ArrayBuffer в строку Base64 с использованием метода из Enigma
               const encryptedDataArray = new Uint8Array(event.target.result);
               const encryptedDataBase64 = this.enigma.arrayToBase64(encryptedDataArray);

               // Конвертируем пароль в Base64
               const base64Password = this.enigma.stringToBase64(password);

               // Расшифровываем данные
               const decryptedDataBase64 = this.enigma.decryptData(encryptedDataBase64, base64Password);

               // Конвертируем расшифрованные данные из Base64 в строку JSON
               const jsonData = this.enigma.base64ToString(decryptedDataBase64);

               // Парсим JSON-строку в объект
               const data = JSON.stringify(jsonData);

               resolve(data);
            } catch (error) {
               console.error("Ошибка расшифровки:", error);
               reject("Ошибка расшифровки: неверный пароль или поврежденные данные");
            }
         };

         reader.onerror = () => reject("Ошибка чтения файла");
         reader.readAsArrayBuffer(file); // Читаем файл как ArrayBuffer
      });
   }
}

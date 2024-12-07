import { Enigma } from "./Enigma";

export class ModalManager {
   constructor() {
      this.body = document.querySelector("body");
      this.modalAuth = document.getElementById("modalAuth");

      this.contentLogin = document.getElementById("contentLogin");
      this.contentLogout = document.getElementById("contentLogout");
      this.contentLoginPassword = document.getElementById("contentLoginPassword");
      this.contentLogoutPassword = document.getElementById("contentLogoutPassword");
   }

   openModal() {
      this.modalAuth?.classList.remove("hidden");
      this.body?.classList.add("overflow-hidden");
   }

   closeModal() {
      this.modalAuth?.classList.add("hidden");
      this.body?.classList.remove("overflow-hidden");
      this.closeModalContentLogin();
      this.closeModalContentLogout();
      this.closeContentLoginPassword();
      this.closeContentLogoutPassword();
   }

   openModalContentLogin() {
      this.contentLogin?.classList.remove("hidden");
   }

   openModalContentLogout() {
      this.contentLogout?.classList.remove("hidden");
   }

   closeModalContentLogin() {
      this.contentLogin?.classList.add("hidden");
   }

   closeModalContentLogout() {
      this.contentLogout?.classList.add("hidden");
   }

   closeContentLoginPassword() {
      this.contentLoginPassword?.classList.add("hidden");
   }

   closeContentLogoutPassword() {
      this.contentLogoutPassword?.classList.add("hidden");
   }
}

export class FileEncryptionManager {
   constructor() {
      this.enigma = new Enigma();
   }

   async saveEncryptedDataToFile(data, password) {
      try {
         const jsonData = JSON.stringify(data);
         const base64Data = this.enigma.stringToBase64(jsonData);
         const base64Password = this.enigma.stringToBase64(password);
         const encryptedDataBase64 = this.enigma.encryptData(base64Data, base64Password);
         const encryptedDataArray = this.enigma.base64ToArray(encryptedDataBase64);

         const blob = new Blob([encryptedDataArray], { type: "application/octet-stream" });
         const link = document.createElement("a");
         link.href = URL.createObjectURL(blob);
         link.download = "vault.data";
         link.click();

         URL.revokeObjectURL(link.href);
      } catch (error) {
         console.error("Error saving encrypted data:", error);
      }
   }

   async loadEncryptedDataFromFile(file, password) {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();

         reader.onload = async (event) => {
            try {
               const encryptedDataArray = new Uint8Array(event.target.result);
               const encryptedDataBase64 = this.enigma.arrayToBase64(encryptedDataArray);
               const base64Password = this.enigma.stringToBase64(password);
               const decryptedDataBase64 = this.enigma.decryptData(encryptedDataBase64, base64Password);
               const jsonData = this.enigma.base64ToString(decryptedDataBase64);
               const data = JSON.stringify(jsonData);

               resolve(data);
            } catch (error) {
               console.error("Decryption error:", error);
               reject("Decryption error: incorrect password or corrupted data");
            }
         };

         reader.onerror = () => reject("File reading error");
         reader.readAsArrayBuffer(file);
      });
   }
}

export class EventHandlers {
   constructor(encryptionManager) {
      this.encryptionManager = encryptionManager;
      this.modalManager = new ModalManager();
      this.fileEncryptionManager = new FileEncryptionManager();

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
            this.modalManager.closeModal();
         }
      });

      popupButtonLogin?.addEventListener("click", () => {
         this.modalManager.openModal();
         this.modalManager.openModalContentLogin();
      });

      popupButtonLogout?.addEventListener("click", () => {
         this.modalManager.openModal();
         this.modalManager.openModalContentLogout();
      });

      closeModalButton.forEach((item) => {
         item.addEventListener("click", () => {
            this.modalManager.closeModal();
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

      confirmImportButtonInput?.addEventListener("change", async (e) => {
         const file = e.target.files[0];
         const password = encryptionPasswordInputLogin.value;
         try {
            const res = await this.fileEncryptionManager.loadEncryptedDataFromFile(file, password);
            this.encryptionManager.setData(JSON.stringify({ userKeipair: JSON.parse(res) }));
            this.modalManager.closeModal();
         } catch (error) {
            console.error(error);
         }
      });

      confirmDownloadButton?.addEventListener("click", async () => {
         try {
            const data = await this.encryptionManager.getData();
            const stringifiedData = JSON.parse(data).userKeipair;
            await this.fileEncryptionManager.saveEncryptedDataToFile(stringifiedData, encryptionPasswordInputLogout.value);
            this.modalManager.closeModal();
            this.encryptionManager.clearVault();
         } catch (error) {
            console.error(error);
         }
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

   async logoutWithoutKeys() {
      await this.encryptionManager.clearVault();
      this.modalManager.closeModal();
   }
}

import { connect, rawStorage, removeAll } from "@lo-fi/local-vault";
import "@lo-fi/local-vault/adapter/local-storage";

/**
 * Класс для управления шифрованием и хранилищем данных.
 * Реализует паттерн Singleton для обеспечения единственного экземпляра.
 * Добавлена поддержка событий через EventTarget.
 */
export class EncryptionManager extends EventTarget {
   // Статическое свойство для хранения единственного экземпляра класса
   static instance = null;

   // Приватные свойства
   #vault = null; // Объект хранилища
   #isAuth = false; // Флаг состояния авторизации
   #rawStore = rawStorage("local-storage"); // Необработанное хранилище для хранения ID
   #abortController = new AbortController(); // Контроллер для отмены операций

   /**
    * Приватный конструктор для реализации Singleton.
    * Используйте EncryptionManager.getInstance() для получения экземпляра.
    */
   constructor() {
      super();
      if (EncryptionManager.instance) {
         return EncryptionManager.instance;
      }
      EncryptionManager.instance = this;
   }

   /**
    * Статический метод для получения единственного экземпляра класса.
    * @returns {EncryptionManager} - Экземпляр класса EncryptionManager.
    */
   static getInstance() {
      if (!EncryptionManager.instance) {
         EncryptionManager.instance = new EncryptionManager();
      }
      return EncryptionManager.instance;
   }

   /**
    * Геттер для доступа к состоянию авторизации.
    * @returns {boolean} - Состояние авторизации (true или false).
    */
   get isAuth() {
      return this.#isAuth;
   }

   /**
    * Сеттер для изменения состояния авторизации.
    * Автоматически отправляет событие authChange при изменении значения.
    * @param {boolean} value - Новое значение состояния авторизации.
    */
   set isAuth(value) {
      if (this.#isAuth !== value) {
         // Проверяем, изменилось ли значение
         this.#isAuth = value;
         this.dispatchEvent(new CustomEvent("authChange", { detail: { isAuth: value } }));
      }
   }

   /**
    * Инициализирует хранилище, подключаясь к существующему или создавая новое.
    */
   async initialize() {
      try {
         const vaultID = await this.getVaultID();
         if (vaultID) {
            await this.connectToVault(vaultID);
         } else {
            await this.createVault();
         }
      } catch (error) {
         await this.handleError(error, "Ошибка при инициализации хранилища");
      }
   }

   /**
    * Создает новое хранилище и сохраняет его ID.
    */
   async createVault() {
      try {
         this.#vault = await connect({
            storageType: "local-storage",
            addNewVault: true,
            keyOptions: {
               username: "biometric-user",
               displayName: "Biometric User",
            },
            signal: this.#abortController.signal,
         });
         await this.saveVaultID(this.#vault.id);

         // Устанавливаем isAuth через сеттер
         this.isAuth = true;

         console.log("Создано новое хранилище с ID:", this.#vault.id);
      } catch (error) {
         await this.handleError(error, "Ошибка при создании нового хранилища");
      }
   }

   /**
    * Подключается к существующему хранилищу по его ID.
    * @param {string} vaultID - Идентификатор хранилища.
    */
   async connectToVault(vaultID) {
      try {
         this.#vault = await connect({
            vaultID,
            storageType: "local-storage",
            signal: this.#abortController.signal,
         });

         // Устанавливаем isAuth через сеттер
         this.isAuth = true;

         console.log("Подключено к существующему хранилищу:", vaultID);
      } catch (error) {
         await this.handleError(error, "Ошибка при подключении к хранилищу");
      }
   }

   /**
    * Сохраняет данные в хранилище.
    * @param {any} value - Данные для сохранения.
    */
   async setData(value) {
      try {
         await this.ensureVault();
         const vaultID = await this.getVaultID();
         await this.#vault.set(vaultID, value, {
            signal: this.#abortController.signal,
         });
         console.log(`Сохранены данные: ключ = "${vaultID}", значение = "${value}"`);
      } catch (error) {
         await this.handleError(error, "Ошибка при сохранении данных");
      }
   }

   /**
    * Получает данные из хранилища.
    * @returns {Promise<any>} - Полученные данные.
    */
   async getData() {
      try {
         await this.ensureVault();
         const vaultID = await this.getVaultID();
         const value = await this.#vault.get(vaultID, {
            signal: this.#abortController.signal,
         });
         console.log(`Получены данные: ключ = "${vaultID}", значение = "${value || "нет данных"}"`);
         return value;
      } catch (error) {
         await this.handleError(error, "Ошибка при получении данных");
      }
   }

   /**
    * Проверяет наличие хранилища.
    * @returns {Promise<boolean>} - true, если хранилище существует, иначе false.
    */
   async hasVault() {
      try {
         const vaultID = await this.getVaultID();
         return !!vaultID;
      } catch (error) {
         console.error("Ошибка при проверке наличия хранилища:", error);
         return false;
      }
   }

   /**
    * Очищает хранилище и удаляет его ID.
    */
   async clearVault() {
      try {
         await removeAll();
         await this.removeVaultID();
         this.#vault = null;

         // Устанавливаем isAuth через сеттер
         this.isAuth = false;

         console.log("Хранилище очищено.");
      } catch (error) {
         console.error("Ошибка при очистке хранилища:", error);
      }
   }

   /**
    * Получает ID хранилища из необработанного хранилища.
    * @returns {Promise<string|null>} - ID хранилища или null, если не найден.
    */
   async getVaultID() {
      return await this.#rawStore.get("vault-id");
   }

   /**
    * Сохраняет ID хранилища в необработанное хранилище.
    * @param {string} id - ID хранилища.
    */
   async saveVaultID(id) {
      await this.#rawStore.set("vault-id", id);
   }

   /**
    * Удаляет ID хранилища из необработанного хранилища.
    */
   async removeVaultID() {
      await this.#rawStore.remove("vault-id");
   }

   /**
    * Проверяет и инициализирует хранилище, если оно не было инициализировано.
    */
   async ensureVault() {
      if (!this.#vault) {
         console.warn("Хранилище не инициализировано. Инициализируем...");
         await this.initialize();
      }
   }

   /**
    * Обрабатывает ошибки, возникающие при операциях с хранилищем.
    * @param {Error} error - Объект ошибки.
    * @param {string} message - Сообщение для отображения.
    */
   async handleError(error, message) {
      this.isAuth = false; // Используем сеттер
      if (this.isCancelError(error)) {
         console.warn(`${message}: Операция отменена пользователем. Очищаем хранилище.`);
         await this.clearVault();
      } else {
         console.error(`${message}:`, error);
      }
   }

   /**
    * Проверяет, является ли ошибка результатом отмены операции.
    * @param {Error} error - Объект ошибки.
    * @returns {boolean} - true, если операция была отменена, иначе false.
    */
   isCancelError(error) {
      return (
         error.message?.includes("The operation either timed out or was not allowed") ||
         error.message?.includes("Credential auth failed") ||
         error.message?.includes("Identity/Passkey registration failed") ||
         error.name === "AbortError"
      );
   }

   /**
    * Отменяет текущую операцию с заданной причиной.
    * @param {string} [reason="Операция отменена"] - Причина отмены операции.
    */
   cancelOperation(reason = "Операция отменена") {
      if (this.#abortController) {
         this.isAuth = false; // Используем сеттер
         this.#abortController.abort(reason);
         this.#abortController = new AbortController();
         console.warn(`Операция отменена: ${reason}`);
      }
   }
}

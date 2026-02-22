import "./index.scss";
import { CONFIG } from "../config.js";
import { EncryptionManager } from "./modules/EncryptionManager.js";
import { EcoTaxiFormHandler } from "./modules/EcoTaxiFormHandler.js";
import { EventHandlers } from "./modules/Authorization.js";

console.log('🚀 Initializing Form V15 - Simplified...');

const instansEncryptionManager = new EncryptionManager();
new EventHandlers(instansEncryptionManager);
new EcoTaxiFormHandler(
   CONFIG.BASE_URL, 
   CONFIG.BOARD, 
   CONFIG.MAIN_KEY, 
   CONFIG.ADMIN_KEY, 
   instansEncryptionManager
);

console.log('✅ Form V15 initialized - File upload ready');

import type { Config } from "tailwindcss";

export default {
   content: ["./src/**/*.html", "./src/**/*.js"],
   theme: {
      extend: {
         colors: {
            primary: "#212529",
            border: "#ced4da",
         }
      }
   }
} satisfies Config;

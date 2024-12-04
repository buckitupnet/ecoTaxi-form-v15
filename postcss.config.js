import tailwindcss from "tailwindcss";
import purgecss from "@fullhuman/postcss-purgecss";
import cssnano from "cssnano";

const isDev = process.env.NODE_ENV !== "production";

export default {
   plugins: [
      tailwindcss(),
      // !isDev
      //    ? purgecss({
      //         content: ["./src/**/*.{html,js,ts,tsx}"],
      //         safelist: ["html", "body", "root", /(xs|sm|md|lg|xl|2xl):\w+/, /!\w+/, /\w+-(?:\[\d+(px|deg)\])?/],
      //         fontFace: false,
      //         variables: true,
      //         keyframes: false,
      //      })
      //    : undefined,
      !isDev
         ? cssnano({
              preset: [
                 "default",
                 {
                    discardComments: { removeAll: true },
                    discardEmpty: true,
                    discardDuplicates: true,
                    minifyFontValues: true,
                 },
              ],
           })
         : undefined,
   ].filter(Boolean),
};

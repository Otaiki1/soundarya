import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadJosefin } from "@remotion/google-fonts/JosefinSans";

export const { fontFamily: playfairFamily } = loadPlayfair("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export const { fontFamily: josefinFamily } = loadJosefin("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

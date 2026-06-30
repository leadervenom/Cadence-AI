import DarkModeTheme from "../models/DarkModeTheme.js";

import LightModeTheme from "../models/LightModeTheme.js";

class ThemeFactory {

    constructor(factoryId, regionScope) {

        this.factoryId = factoryId;

        this.regionScope = regionScope;

    }


    createTheme(env) {

        switch(env.toLowerCase()) {

            case "dark":

                return new DarkModeTheme();


            case "light":

                return new LightModeTheme();


            default:

                throw new Error(

                    "Invalid theme."

                );

        }

    }

}

export default ThemeFactory;
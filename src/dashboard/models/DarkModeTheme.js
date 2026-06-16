import Theme from "../interfaces/Theme.js";

class DarkModeTheme extends Theme {
    constructor() {
        super();

        this.primaryColor = "#121212";
        this.secondaryColor = "#1E1E1E";
        this.contrastRatio = 7;
    }

    applyThemeStyle() {
        return {
            theme: "Dark",

            primaryColor: this.primaryColor,

            secondaryColor: this.secondaryColor,

            contrastRatio: this.contrastRatio
        };
    }
}

export default DarkModeTheme;
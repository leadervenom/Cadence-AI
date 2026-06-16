import Theme from "../interfaces/Theme.js";

class LightModeTheme extends Theme {
    constructor() {
        super();

        this.primaryColor = "#FFFFFF";
        this.secondaryColor = "#F5F5F5";
        this.contrastRatio = 4.5;
    }

    applyThemeStyle() {
        return {
            theme: "Light",

            primaryColor: this.primaryColor,

            secondaryColor: this.secondaryColor,

            contrastRatio: this.contrastRatio
        };
    }
}

export default LightModeTheme;
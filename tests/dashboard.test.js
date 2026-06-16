import ThemeFactory from "../src/dashboard/factories/ThemeFactory.js";

console.log("Dashboard test started");


const factory = new ThemeFactory(
    1,
    "GLOBAL"
);


const darkTheme = factory.createTheme(
    "dark"
);


console.log(
    darkTheme.applyThemeStyle()
);


const lightTheme = factory.createTheme(
    "light"
);


console.log(
    lightTheme.applyThemeStyle()
);


console.log("Dashboard test finished");
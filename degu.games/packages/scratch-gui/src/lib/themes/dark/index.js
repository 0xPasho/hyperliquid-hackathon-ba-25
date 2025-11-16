const blockColors = {
    // Solid color fills - CSS will apply opacity via fill-opacity
    motion: {
        primary: "#4C97FF", // Blue fill (CSS makes it semi-transparent)
        secondary: "#4C97FF",
        tertiary: "#4C97FF", // Bright blue border
        quaternary: "#4C97FF",
    },
    looks: {
        primary: "#9966FF", // Purple fill (CSS makes it semi-transparent)
        secondary: "#9966FF",
        tertiary: "#9966FF", // Purple border
        quaternary: "#9966FF",
    },
    sounds: {
        primary: "#CF63CF", // Magenta fill (CSS makes it semi-transparent)
        secondary: "#CF63CF",
        tertiary: "#CF63CF", // Magenta border
        quaternary: "#CF63CF",
    },
    control: {
        primary: "#FFAB19", // Orange fill (CSS makes it semi-transparent)
        secondary: "#FFAB19",
        tertiary: "#FFAB19", // Orange border
        quaternary: "#FFAB19",
    },
    event: {
        primary: "#FFBF00", // Yellow fill (CSS makes it semi-transparent)
        secondary: "#FFBF00",
        tertiary: "#FFBF00", // Yellow border
        quaternary: "#FFBF00",
    },
    sensing: {
        primary: "#5CB1D6", // Cyan fill (CSS makes it semi-transparent)
        secondary: "#5CB1D6",
        tertiary: "#5CB1D6", // Cyan border
        quaternary: "#5CB1D6",
    },
    pen: {
        primary: "#29BEB8", // Teal fill (CSS makes it semi-transparent) - Blockchain
        secondary: "#29BEB8",
        tertiary: "#29BEB8", // Teal border
        quaternary: "#29BEB8",
    },
    operators: {
        primary: "#59C059", // Green fill (CSS makes it semi-transparent)
        secondary: "#59C059",
        tertiary: "#59C059", // Green border
        quaternary: "#59C059",
    },
    data: {
        primary: "#FF8C1A", // Orange fill (CSS makes it semi-transparent) - Variables
        secondary: "#FF8C1A",
        tertiary: "#FF8C1A", // Orange border
        quaternary: "#FF8C1A",
    },
    data_lists: {
        primary: "#FF8C1A", // Orange fill (CSS makes it semi-transparent) - Lists
        secondary: "#FF8C1A",
        tertiary: "#FF8C1A", // Orange border
        quaternary: "#FF8C1A",
    },
    more: {
        primary: "#FF6680", // Pink fill (CSS makes it semi-transparent) - My Blocks
        secondary: "#FF6680",
        tertiary: "#FF6680", // Pink border
        quaternary: "#FF6680",
    },

    // Premium dark UI - much darker, more dramatic
    text: "#FFFFFF", // Pure white text on blocks
    textFieldText: "#FFFFFF", // White text in inputs
    workspace: "#151520", // Very dark purple-black canvas
    toolboxHover: "rgba(180, 0, 255, 0.3)", // Purple glow hover
    toolboxSelected: "#1A0A28", // Dark purple selected
    toolboxText: "#FFFFFF", // Pure white text
    toolbox: "#0A0A0F", // Deeper dark background
    flyout: "#12121A", // Darker card background
    scrollbar: "#222233", // Darker scrollbar
    scrollbarHover: "#333344", // Disabled with purple tint
    textField: "#FFFFFF", // White input fields background
    textFieldBackground: "#1A1A25", // Dark input background

    // Glows and markers - very subtle, dark theme
    insertionMarker: "#FF0AA6", // Bright pink
    insertionMarkerOpacity: 0.45,
    dragShadowOpacity: 0.7,
    stackGlow: "#000000", // Dark glow for running blocks (subtle)
    stackGlowSize: 2,
    stackGlowOpacity: 0.15,
    replacementGlow: "#FF0AA6", // Bright pink
    replacementGlowSize: 3,
    replacementGlowOpacity: 0.9,

    // Misc UI surfaces - premium dark
    colourPickerStroke: "#FFFFFF",
    fieldShadow: "rgba(180, 0, 255, 0.4)", // Stronger purple glow
    dropDownShadow: "rgba(0, 0, 0, .7)",
    numPadBackground: "#1A0A28", // Darker ambient
    numPadBorder: "#222233", // Darker divider
    numPadActiveBackground: "#252535", // Hover
    numPadText: "#FFFFFF",
    valueReportBackground: "#12121A", // Darker card
    valueReportBorder: "#222233", // Darker divider
    menuHover: "rgba(180, 0, 255, 0.4)", // Stronger purple glow
};

const extensions = {};

export { blockColors, extensions };

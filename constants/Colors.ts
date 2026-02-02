export const Colors = {
    light: {
        background: '#FFFFFF',
        text: '#000000',
        primary: '#000000',
        secondary: '#333333',
        card: '#F5F5F5',
        border: '#E0E0E0',
        notification: '#000000',
        error: '#FF0000', // Keep error red, or make it stylized? Sticking to standard for now but maybe monochrome.
    },
    dark: {
        background: '#000000',
        text: '#FFFFFF',
        primary: '#FFFFFF',
        secondary: '#CCCCCC',
        card: '#121212',
        border: '#333333',
        notification: '#FFFFFF',
        error: '#FF4444',
    },
};

export const Theme = {
    colors: Colors.dark, // Default to dark mode as per "Pure Black & White theme" request
};

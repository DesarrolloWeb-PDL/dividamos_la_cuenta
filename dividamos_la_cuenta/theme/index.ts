export const colors = {
    primary: '#e85d04', // Orange accent
    primaryDark: '#d45203', // Orange hover
    secondary: '#ff7b1a', // Orange light
    background: '#0a0a0a', // Dark background
    surface: '#141414', // Card background
    text: '#ededed', // Light text
    textLight: '#a1a1aa', // Muted text
    error: '#ef4444', // Red error
    border: '#262626', // Border color
    white: '#ffffff',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const typography = {
    h1: {
        fontSize: 28,
        fontWeight: 'bold' as 'bold',
        color: colors.text,
    },
    h2: {
        fontSize: 22,
        fontWeight: '600' as '600',
        color: colors.text,
    },
    body: {
        fontSize: 16,
        color: colors.text,
    },
    caption: {
        fontSize: 14,
        color: colors.textLight,
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as '600',
        color: colors.white,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
};
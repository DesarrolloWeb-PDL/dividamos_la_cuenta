export const colors = {
    primary: '#4F46E5', // Indigo 600
    primaryDark: '#4338CA', // Indigo 700
    secondary: '#10B981', // Emerald 500
    background: '#F3F4F6', // Gray 100
    surface: '#FFFFFF',
    text: '#1F2937', // Gray 800
    textLight: '#6B7280', // Gray 500
    error: '#EF4444', // Red 500
    border: '#E5E7EB', // Gray 200
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
        color: colors.surface,
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
};

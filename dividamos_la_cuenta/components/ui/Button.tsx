import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
}: ButtonProps) {
    const getBackgroundColor = () => {
        if (disabled) return colors.textLight;
        switch (variant) {
            case 'primary':
                return colors.primary;
            case 'secondary':
                return colors.secondary;
            case 'outline':
                return 'transparent';
            default:
                return colors.primary;
        }
    };

    const getTextColor = () => {
        if (variant === 'outline') return colors.primary;
        return colors.surface;
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor() },
                variant === 'outline' && styles.outline,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing.xs,
    },
    outline: {
        borderWidth: 1,
        borderColor: colors.primary,
    },
    text: {
        ...typography.button,
    },
});

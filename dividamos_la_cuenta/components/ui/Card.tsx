import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, spacing } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.md,
    },
});
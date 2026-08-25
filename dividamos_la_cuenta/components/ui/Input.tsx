import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                    style,
                ]}
                placeholderTextColor={colors.textLight}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.sm,
        color: colors.text,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.md,
        ...typography.body,
        color: colors.text,
    },
    inputError: {
        borderColor: colors.error,
    },
    error: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
});
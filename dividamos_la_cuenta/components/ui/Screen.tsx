import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface ScreenProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export default function Screen({ children, style }: ScreenProps) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <View style={[styles.container, style]}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: spacing.md,
    },
});
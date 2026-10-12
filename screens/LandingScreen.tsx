import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { useAppTheme } from '../theme/appTheme';

type Props = {
  navigation: { replace: (screen: string) => void };
};

const FEATURES = [
  {
    title: 'Grupos',
    description: 'Un grupo por viaje, cena o departmento. Los gastos de cada uno, juntos.',
  },
  {
    title: 'Repartición clara',
    description: 'Cada gasto muestra cómo se divide entre los integrantes. Sin cuentas pendientes.',
  },
  {
    title: 'Saldo final',
    description: 'En un vistazo sabés quién le tiene que pagar a quién. Listo.',
  },
];

function IsometricCubes({ size = 96, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="50,15 65,22.5 65,36.5 50,44 35,36.5 35,22.5" fill={color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <Polygon points="28,45 43,52.5 43,66.5 28,74 13,66.5 13,52.5" fill={color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <Polygon points="72,45 87,52.5 87,66.5 72,74 57,66.5 57,52.5" fill={color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M35 22.5 L50 30 L65 22.5 M50 30 L50 44" stroke="#fafafa" strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Path d="M13 52.5 L28 60 L43 52.5 M28 60 L28 74" stroke="#fafafa" strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Path d="M57 52.5 L72 60 L87 52.5 M72 60 L72 74" stroke="#fafafa" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export default function LandingScreen({ navigation }: Props) {
  const { colors } = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 48,
      maxWidth: 440,
      width: '100%',
      alignSelf: 'center',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2.4,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 14,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '300',
      color: colors.textMuted,
      marginBottom: 28,
    },
    logoWrap: {
      alignItems: 'center',
      marginBottom: 28,
    },
    description: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.textMuted,
      marginBottom: 36,
    },
    featureRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingVertical: 16,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.textMuted,
    },
    cta: {
      marginTop: 32,
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.2,
    },
    footer: {
      marginTop: 40,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerNote: {
      fontSize: 12,
      color: colors.textMuted,
    },
    footerLink: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
  }), [colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Gastos compartidos</Text>
        <Text style={styles.title}>Dividamos la Cuenta</Text>
        <Text style={styles.subtitle}>Sin planillas. Sin discusiones.</Text>

        <View style={styles.logoWrap}>
          <IsometricCubes color={colors.primary} />
        </View>

        <Text style={styles.description}>
          Organizá los gastos del grupo al toque: quién paga qué, cómo se divide
          y quién le debe a quién. Cargás los gastos y la app hace la cuenta.
        </Text>

        {FEATURES.map(feature => (
          <View key={feature.title} style={styles.featureRow}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}

        <Pressable onPress={() => navigation.replace('Groups')}>
          <Text style={styles.cta}>Empezar →</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>Hecho por </Text>
          <Pressable onPress={() => Linking.openURL('https://desarrolloweb-pdl.vercel.app')}>
            <Text style={styles.footerLink}>DesarrolloWeb-pdl</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

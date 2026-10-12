import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

function CubesLogo({ size = 96, color }: { size?: number; color: string }) {
  const cell = size * 0.44;
  const gap = size * 0.12;
  const opacity = [1, 0.7, 0.5, 0.3];

  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {opacity.map((o, i) => (
        <View
          key={i}
          style={{
            width: cell,
            height: cell,
            borderRadius: cell * 0.22,
            backgroundColor: color,
            opacity: o,
            margin: gap / 2,
          }}
        />
      ))}
    </View>
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
    footerNote: {
      marginTop: 40,
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Gastos compartidos</Text>
        <Text style={styles.title}>Dividamos la Cuenta</Text>
        <Text style={styles.subtitle}>Sin planillas. Sin discusiones.</Text>

        <View style={styles.logoWrap}>
          <CubesLogo color={colors.primary} />
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

        <Text style={styles.footerNote}>Hecho en Paso de los Libres</Text>
      </ScrollView>
    </View>
  );
}

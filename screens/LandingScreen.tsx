import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { APP_DISPLAY_NAME, APP_TAGLINE } from '../services/appConfig';
import { AppPalette, useAppTheme } from '../theme/appTheme';

type Props = {
  navigation: { replace: (screen: string) => void };
};

const FEATURES = [
  {
    icon: 'account-group-outline' as const,
    title: 'Grupos con lo tuyo',
    description: 'Un grupo por viaje, cena o departmento. Cada uno con sus integrantes y sus gastos.',
  },
  {
    icon: 'calculator-variant-outline' as const,
    title: 'Reparto al toque',
    description: 'Cargás un gasto y la app muestra cómo se divide entre el grupo. Sin cuenta mental.',
  },
  {
    icon: 'scale-balance' as const,
    title: 'Saldo final claro',
    description: 'En una lista ves quién le tiene que pagar a quién. Listo, cerrado.',
  },
];

export default function LandingScreen({ navigation }: Props) {
  const { colors, mode, cycleMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Pressable onPress={cycleMode} style={styles.themeToggle}>
            <Text style={styles.themeToggleIcon}>{mode === 'dark' ? '☀' : '☾'}</Text>
          </Pressable>

          <Text style={styles.eyebrow}>Aplicación para dividir gastos</Text>
          <Text style={styles.title}>{APP_DISPLAY_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>

          <View style={styles.logoWrap}>
            <View style={styles.pdlLogo}>
              <View style={[styles.pdlRect, { opacity: 1 }]} />
              <View style={[styles.pdlRect, { opacity: 0.7 }]} />
              <View style={[styles.pdlRect, { opacity: 0.5 }]} />
              <View style={[styles.pdlRect, { opacity: 0.3 }]} />
            </View>
          </View>

          <Text style={styles.subtitle}>
            Creá tu grupo, cargá los gastos compartidos y enterate al toque cuánto le tiene que pagar
            cada integrante. Sin planillas ni discusiones.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.sectionHeading}>¿Cómo funciona?</Text>
          {FEATURES.map(feature => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={feature.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureTexts}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <CustomButton title="Empezar" onPress={() => navigation.replace('Groups')} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerCopyright}>© 2026 Dividamos la Cuenta. Todos los derechos reservados.</Text>
        <Pressable onPress={() => Linking.openURL('https://desarrolloweb-pdl.vercel.app/')} style={styles.footerBrand}>
          <View style={styles.footerPdlLogo}>
            <View style={[styles.footerPdlRect, { opacity: 1 }]} />
            <View style={[styles.footerPdlRect, { opacity: 0.7 }]} />
            <View style={[styles.footerPdlRect, { opacity: 0.5 }]} />
            <View style={[styles.footerPdlRect, { opacity: 0.3 }]} />
          </View>
          <Text style={styles.footerBrandText}>DesarrolloWeb-pdl</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  hero: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
  },
  themeToggle: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  themeToggleIcon: { color: colors.text, fontWeight: '700', fontSize: 18 },
  eyebrow: {
    color: colors.primary,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    marginBottom: 28,
  },
  pdlLogo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 104,
    height: 104,
    gap: 8,
  },
  pdlRect: {
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 380,
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10 },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  featureTexts: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  featureDescription: { fontSize: 13.5, lineHeight: 19, color: colors.textMuted },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  footerCopyright: {
    color: colors.textMuted,
    fontSize: 12,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerPdlLogo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 16,
    height: 16,
    gap: 1,
  },
  footerPdlRect: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  footerBrandText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});

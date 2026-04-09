# Dividamos la Cuenta

App móvil Expo React Native para dividir gastos P2P (Split-Bill).

La app activa del proyecto vive en esta raíz y arranca desde App.tsx.

## Instalación

1. Instalá dependencias:
   ```bash
   npm install
   ```
2. Iniciá la app:
   ```bash
   npx expo start
   ```

## Estructura
- `models/`: Modelos de datos (Realm)
- `services/`: Servicios (API, almacenamiento seguro)
- `screens/`: Pantallas principales
- `components/`: Componentes reutilizables
- `App.tsx`: navegación principal de la app

## Funcionalidades MVP
- Alta de usuarios
- Alta de gastos con pagador, participantes y división igual o personalizada
- Cálculo de saldos y liquidación sugerida
- Compartir liquidación por WhatsApp o share nativo

## Validación manual

Para probar el flujo completo del MVP, seguí la guía en [MANUAL-TESTING.md](MANUAL-TESTING.md).

---
Para más detalles, revisá la documentación en cada carpeta.

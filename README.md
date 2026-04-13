# Dividamos la Cuenta

App Expo React Native para dividir cuentas por grupo.

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
3. Si querés abrir directo la versión web:
   ```bash
   npm run web
   ```

## Cómo funciona ahora

- La pantalla principal muestra grupos.
- Cada grupo tiene sus propios integrantes, gastos y liquidación.
- Cada gasto puede tener uno o varios pagadores.
- Los pagos se guardan como montos explícitos, no como porcentajes.
- El consumo se divide en partes iguales o con montos personalizados.
- La cuenta correcta se calcula como: saldo = pagos - consumo.

## Estructura
- `models/`: Tipos de Group, User y Expense.
- `services/`: Persistencia local y lógica de liquidación.
- `screens/`: Pantallas de grupos, integrantes y gastos.
- `components/`: Componentes reutilizables.
- `App.tsx`: navegación principal de la app.

## Flujo MVP actual

1. Crear grupo.
2. Agregar integrantes al grupo.
3. Opcionalmente importar un contacto desde el teléfono en móvil.
3. Cargar un gasto dentro del grupo.
4. Marcar quiénes participaron.
5. Marcar quiénes pagaron y cuánto puso cada uno.
6. Elegir división igualitaria o personalizada.
7. Ver saldos y liquidación sugerida sólo para ese grupo.

## Contactos del teléfono

- La importación básica de un contacto ya está integrada para Android/iPhone.
- En web se muestra fallback y no intenta acceder a contactos.
- El contacto importado precarga nombre, teléfono y alias sugerido antes de guardar.
- Si el teléfono ya existe dentro del grupo, la app bloquea el duplicado.

## Validación manual

Para probar el flujo completo actualizado, seguí la guía en [MANUAL-TESTING.md](MANUAL-TESTING.md).

## Web y Vercel

Este proyecto puede publicarse como versión web estática de Expo.

- Desarrollo web local: `npm run web`
- Export estático web: `npm run export:web`
- Salida esperada del export: carpeta `dist/`

Configuración recomendada en Vercel:

1. Framework preset: Other
2. Build command: `npm run export:web`
3. Output directory: `dist`
4. El repo ya incluye [vercel.json](vercel.json) con la configuración mínima para servir la manifest web correctamente.

## Instalar Como App Web

La versión web se puede usar como PWA en el celular, o sea, agregarla a la pantalla de inicio para abrirla como si fuera una app.

1. Publicá la versión web en HTTPS.
2. Abrila desde Chrome en Android o Safari en iPhone.
3. En Android: menú del navegador -> `Instalar app` o `Agregar a pantalla principal`.
4. En iPhone: compartir -> `Agregar a pantalla de inicio`.

### Publicación rápida en Vercel

1. Importá el repo en Vercel.
2. Usá `Other` como framework.
3. Configurá `npm run export:web` como build command.
4. Configurá `dist` como output directory.
5. Publicá en HTTPS.
6. Abrí esa URL desde el celular y usá la opción de instalar desde el navegador.

Al instalarla, la app se abre en modo standalone y queda accesible desde el inicio del teléfono.

Nota: esta app sigue siendo un proyecto Expo móvil primero. Vercel sirve para publicar la variante web, no la app nativa Android/iOS.

---
Para más detalles, revisá la documentación en cada carpeta.

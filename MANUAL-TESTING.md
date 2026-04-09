# Prueba Manual MVP

## Preparación

1. Instalá dependencias:
   ```bash
   npm install
   ```
2. Levantá Expo:
   ```bash
   npx expo start
   ```
3. Abrí la app en un dispositivo o emulador.

## Flujo sugerido

1. Entrá a Usuarios.
   Resultado esperado: la lista aparece vacía y podés navegar a Agregar Usuario.
2. Cargá al menos 3 usuarios.
   Resultado esperado: al volver, la lista muestra los usuarios sin reiniciar la app.
3. Volvé a la Home.
   Resultado esperado: la pantalla muestra acciones principales, métricas y una lista vacía de gastos.
4. Creá un gasto con descripción, monto, participantes y pagador.
   Resultado esperado: al volver a Home aparece el gasto nuevo.
5. Creá otro gasto usando montos personalizados por participante.
   Resultado esperado: la app sólo permite guardar si la suma de montos personalizados coincide con el total.
6. Revisá el bloque de saldos.
   Resultado esperado: la persona que pagó queda a favor y quienes participaron quedan con deuda proporcional.
7. Revisá el bloque de liquidación sugerida.
   Resultado esperado: aparece al menos una transferencia si hay deuda entre usuarios.
8. Abrí el detalle del gasto en la Home.
   Resultado esperado: cada participante muestra cuánto le corresponde aportar, respetando el modo igualitario o personalizado.
9. Tocá Compartir liquidación.
   Resultado esperado: si WhatsApp está instalado abre con el mensaje precargado; si no, aparece el share nativo.

## Casos de borde

1. Intentá crear un gasto sin participantes.
   Resultado esperado: aparece un alert de validación.
2. Intentá crear un gasto sin pagador.
   Resultado esperado: aparece un alert de validación.
3. Intentá crear un gasto con monto inválido.
   Resultado esperado: aparece un alert de validación.
4. Intentá guardar una división personalizada cuya suma no coincide con el total.
   Resultado esperado: aparece un alert de validación.

## Qué revisar visualmente

1. Que la Home siga siendo legible con 10 o más gastos.
2. Que los montos se vean con dos decimales.
3. Que los nombres de usuarios no queden truncados de forma confusa.
4. Que el share no se rompa si no hay gastos cargados.
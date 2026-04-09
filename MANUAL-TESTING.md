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
3. Abrí la app en un dispositivo, emulador o en web con `w`.

## Flujo sugerido principal

1. Entrá a la pantalla de grupos.
   Resultado esperado: si no hay datos, aparece el estado vacío y el botón para crear un grupo.
2. Creá un grupo nuevo.
   Resultado esperado: la app navega al resumen del grupo recién creado.
3. Entrá a Integrantes y cargá al menos 3 personas.
   Resultado esperado: la lista muestra alias o nombre sin reiniciar la app.
4. Si probás desde Android o iPhone, usá Importar desde contactos.
   Resultado esperado: al elegir un contacto con teléfono, el formulario de alta se abre precargado.
5. Intentá guardar un contacto cuyo teléfono ya exista en el grupo.
   Resultado esperado: la app avisa que ya existe un integrante con ese teléfono.
4. Volvé al resumen del grupo.
   Resultado esperado: la tarjeta de métricas muestra integrantes y cero gastos.
5. Creá un gasto de $100 con 4 participantes y un solo pagador que ponga $100.
   Resultado esperado: el gasto se guarda y el pagador queda a favor por lo que adelantó menos su propio consumo.
6. Creá otro gasto de $100 con dos pagadores: uno pone $80 y otro $20.
   Resultado esperado: la app sólo deja guardar si la suma de pagos da exactamente $100.
7. Usá división igualitaria en ese segundo gasto.
   Resultado esperado: el consumo se reparte entre todos los participantes, incluyendo a quienes pagaron.
8. Creá un tercer gasto con división personalizada.
   Resultado esperado: la app sólo deja guardar si la suma del consumo personalizado coincide con el total.
9. Revisá el bloque de saldos.
   Resultado esperado: cada integrante muestra su saldo neto dentro del grupo según pagos menos consumo.
10. Revisá la liquidación sugerida.
    Resultado esperado: aparecen transferencias entre deudores y acreedores del grupo.
11. Tocá Compartir liquidación.
    Resultado esperado: si WhatsApp está instalado abre con el mensaje precargado; si no, aparece el share nativo.

## Casos de borde

1. Intentá crear un gasto sin participantes.
   Resultado esperado: aparece un alert de validación.
2. Intentá crear un gasto sin personas que paguen.
   Resultado esperado: aparece un alert de validación.
3. Intentá cargar pagos cuya suma no coincida con el total.
   Resultado esperado: aparece un alert de validación.
4. Intentá crear un gasto con monto inválido.
   Resultado esperado: aparece un alert de validación.
5. Intentá guardar una división personalizada cuya suma no coincida con el total.
   Resultado esperado: aparece un alert de validación.
6. Intentá abrir un grupo sin integrantes y crear un gasto.
   Resultado esperado: la app invita a ir a la pantalla de integrantes.
7. Intentá importar contactos desde web.
   Resultado esperado: la app muestra que esa función está disponible sólo en móvil.

## Qué revisar visualmente

1. Que la lista de grupos sea legible y muestre cantidad de integrantes y gastos.
2. Que el formulario de gasto deje clara la diferencia entre participar y pagar.
3. Que los totales de pagos cargados y consumo asignado se entiendan sin ambigüedad.
4. Que los montos se vean con dos decimales en resumen y liquidación.
5. Que alias y nombres no queden truncados de forma confusa.
6. Que compartir no se rompa si el grupo todavía no tiene gastos.

## Nota sobre datos previos

Si venías usando una versión vieja de la app sin grupos, puede haber datos viejos en el storage local que ya no entren en el flujo nuevo. Para una validación limpia, probá con almacenamiento vacío o reinstalando la app de desarrollo.
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
4. Si querés probarla como app web instalada, publicala en HTTPS y agregala a la pantalla de inicio desde el navegador del celular.

## Flujo sugerido principal

1. Entrá a la pantalla de grupos.
   Resultado esperado: si no hay datos, aparece el estado vacío y el botón para crear un grupo.
2. Probá el toggle de tema en la pantalla principal.
   Resultado esperado: la app alterna entre modo claro, oscuro y automático sin perder navegación ni legibilidad.
3. Cerrá y volvé a abrir la app después de cambiar el tema.
   Resultado esperado: la preferencia elegida se conserva entre sesiones.
4. Creá un grupo nuevo.
   Resultado esperado: la app navega al resumen del grupo recién creado.
5. Editá el nombre o la descripción del grupo desde la lista de grupos.
   Resultado esperado: los cambios se guardan y el grupo mantiene sus integrantes y gastos.
6. Cargá un link válido del grupo de WhatsApp al crear o editar el grupo.
   Resultado esperado: el grupo guarda ese destino para el share general.
7. Eliminá un grupo desde la lista.
   Resultado esperado: la app pide confirmación y, al aceptar, borra también sus integrantes y gastos.
8. Entrá a Integrantes y cargá al menos 3 personas.
   Resultado esperado: la lista muestra alias o nombre sin reiniciar la app.
9. Si probás desde Android o iPhone, usá Importar desde contactos.
   Resultado esperado: al elegir un contacto con teléfono, el formulario de alta se abre precargado.
10. Si probás desde Chrome en Android, usá también Importar desde contactos en la versión web publicada.
   Resultado esperado: si Chrome expone el selector de contactos, la app deja elegir uno y precarga el formulario.
11. Intentá editar un integrante y cambiar nombre, alias o teléfono.
   Resultado esperado: la lista refleja los cambios al volver.
12. Cargá alias o link de cobro en un integrante.
   Resultado esperado: ese dato queda guardado y luego aparece en los mensajes de transferencia.
13. Intentá guardar un contacto cuyo teléfono ya exista en el grupo.
   Resultado esperado: la app avisa que ya existe un integrante con ese teléfono.
14. Intentá eliminar un integrante sin gastos asociados.
   Resultado esperado: la app pide confirmación y luego lo elimina.
15. Si ese integrante participa en gastos, intentá eliminarlo.
    Resultado esperado: la app bloquea la acción y explica que primero hay que borrar esos gastos.
16. Volvé al resumen del grupo.
   Resultado esperado: la tarjeta de métricas muestra integrantes y cero gastos.
17. Creá un gasto de $100 con 4 participantes y un solo pagador que ponga $100.
   Resultado esperado: el gasto se guarda y el pagador queda a favor por lo que adelantó menos su propio consumo.
18. Antes de guardar un gasto, tocá `Calcular división`.
   Resultado esperado: aparece una vista previa con pagos y consumo por integrante, sin guardar todavía el gasto.
19. Editá uno de los gastos desde el resumen del grupo.
   Resultado esperado: el formulario se precarga, permite guardar cambios y la liquidación se recalcula.
20. Eliminá un gasto individual desde el resumen del grupo.
   Resultado esperado: la app confirma, elimina el gasto y actualiza saldos y transferencias.
21. Usá `Limpiar gastos` al final del resumen del grupo.
   Resultado esperado: la app confirma, borra todos los gastos del grupo y conserva integrantes y grupo.
22. Creá otro gasto de $100 con dos pagadores: uno pone $80 y otro $20.
   Resultado esperado: la app sólo deja guardar si la suma de pagos da exactamente $100.
23. Usá división igualitaria en ese segundo gasto.
   Resultado esperado: el consumo se reparte entre todos los participantes, incluyendo a quienes pagaron.
24. Creá un tercer gasto con división personalizada.
   Resultado esperado: la app sólo deja guardar si la suma del consumo personalizado coincide con el total.
25. Revisá el bloque de saldos.
   Resultado esperado: cada integrante muestra su saldo neto dentro del grupo según pagos menos consumo.
26. Revisá la liquidación sugerida.
    Resultado esperado: aparecen transferencias entre deudores y acreedores del grupo.
27. Tocá las acciones de compartir y probá al menos `Compartir resumen completo` y `Compartir sólo transferencias` con link de grupo configurado.
   Resultado esperado: la app copia el mensaje y abre el grupo de WhatsApp para pegarlo ahí.
28. Probá `Compartir mensaje corto` sin link de grupo configurado.
   Resultado esperado: se comparte una versión breve de la liquidación, pensada para copiar o reenviar rápido.
29. Tocá el botón `WhatsApp` en una transferencia individual.
   Resultado esperado: abre el chat del deudor correcto con un mensaje precargado indicando cuánto, a quién pagar y el alias/link de cobro si está cargado.

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
7. Intentá importar contactos desde web en un navegador sin soporte.
   Resultado esperado: la app explica que ese navegador no permite elegir contactos y ofrece seguir manualmente.
8. Intentá eliminar un integrante ya usado en gastos.
   Resultado esperado: la app bloquea la acción para no romper la liquidación.
9. Cambiá de tema varias veces mientras navegás pantallas.
   Resultado esperado: no hay fondos o textos ilegibles al alternar claro, oscuro y automático.
10. Reiniciá la app después de elegir claro u oscuro.
   Resultado esperado: el modo elegido se mantiene al volver a abrir.
11. Abrí la versión web publicada desde el navegador del celular y revisá la tarjeta `Instalar app`.
   Resultado esperado: si Chrome dispara el prompt, aparece el botón para instalar; si no, se muestran instrucciones manuales.
12. Verificá el acceso directo instalado en la pantalla de inicio del celular.
   Resultado esperado: el icono usa la identidad visual de Dividamos CTA y no un favicon genérico del navegador.
13. Abrí la app instalada y volvé a cerrarla desde multitarea.
   Resultado esperado: al reabrirla sigue entrando sin barra visible de navegador o con mínima UI según soporte del sistema.

## Qué revisar visualmente

1. Que la lista de grupos sea legible y muestre cantidad de integrantes y gastos.
2. Que el formulario de gasto deje clara la diferencia entre participar y pagar.
3. Que los totales de pagos cargados y consumo asignado se entiendan sin ambigüedad.
4. Que los montos se vean con dos decimales en resumen y liquidación.
5. Que alias y nombres no queden truncados de forma confusa.
6. Que compartir no se rompa si el grupo todavía no tiene gastos.
7. Que las tres variantes de share muestren el contenido esperado para el mismo grupo.

## Nota sobre datos previos

Si venías usando una versión vieja de la app sin grupos, puede haber datos viejos en el storage local que ya no entren en el flujo nuevo. Para una validación limpia, probá con almacenamiento vacío o reinstalando la app de desarrollo.
# Roadmap de Contactos y Share

## Objetivo

Agregar importación de contactos del teléfono para sumar integrantes más rápido y mejorar el flujo de compartir por WhatsApp dentro de cada grupo.

## Decisiones técnicas

1. La importación de contactos se implementa sólo en Android/iOS.
2. En web se debe mostrar fallback explícito, porque Expo Contacts no está disponible ahí.
3. El dato importado no reemplaza la lógica actual del grupo: sólo acelera la carga de integrantes.
4. El alias sigue siendo editable por el usuario aunque venga sugerido desde contactos.
5. El share principal sigue siendo por grupo, no por gasto individual.

## Base técnica verificada

### Contactos en Expo

- Expo Contacts expone `requestPermissionsAsync()` y `getContactsAsync()`.
- Expo Contacts también ofrece `presentContactPickerAsync()` para selección nativa de un contacto.
- Expo Contacts reporta `isAvailableAsync()` y en web resuelve `false`.
- En Android el módulo agrega permisos de contactos automáticamente.
- En iOS usa la clave de permisos de contactos del sistema.

### Share en Expo

- Para compartir texto a WhatsApp, el flujo actual con `whatsapp://send?text=...` sigue siendo válido.
- Como fallback, el share nativo general sigue siendo correcto.
- En web, la capa `expo-sharing` depende de Web Share API y requiere HTTPS para funcionar bien.

## Alcance recomendado de la próxima iteración

### Fase 1

- Instalar `expo-contacts`.
- Crear servicio `contactImportService` con wrapper nativo y fallback web.
- Agregar botón `Importar desde contactos` en la pantalla de integrantes.
- Permitir seleccionar un contacto y precargar nombre y teléfono en alta de integrante.

### Fase 2

- Permitir importar varios contactos en lote.
- Detectar duplicados por teléfono dentro del grupo.
- Sugerir alias desde nombre corto o primer nombre.

### Fase 3

- Mejorar share por WhatsApp con variantes por grupo:
- Resumen completo de saldos.
- Sólo transferencias sugeridas.
- Mensaje corto listo para copiar.

## UX recomendada

1. En la pantalla de integrantes, mostrar dos acciones: `Agregar manualmente` e `Importar desde contactos`.
2. Si no hay permisos, mostrar explicación corta y pedir acceso.
3. Si la plataforma es web, mostrar mensaje: `La importación de contactos está disponible sólo en la app móvil`.
4. Antes de guardar un importado, dejar editar alias y teléfono.
5. Si el teléfono ya existe en el grupo, ofrecer reutilizar el integrante existente.

## Riesgos

1. En web no hay acceso real a contactos con Expo Contacts.
2. Los contactos del teléfono pueden venir sin número normalizado o con múltiples números.
3. Si se importa sin deduplicación, vas a terminar con integrantes repetidos en el mismo grupo.
4. El share web tiene limitaciones del navegador y no conviene venderlo como equivalente al móvil.

## Primer corte implementable

El primer corte sano es:

1. Importación de un solo contacto nativo.
2. Precarga de nombre y teléfono.
3. Edición manual antes de guardar.
4. Fallback claro en web.
5. Share por grupo manteniendo WhatsApp + fallback nativo.
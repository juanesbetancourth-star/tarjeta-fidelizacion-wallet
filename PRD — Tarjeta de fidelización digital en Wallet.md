# PRD — Tarjeta de fidelización digital en Wallet

Oct 8, 2026 · @juan

## 1. Resumen ejecutivo

Es un SaaS de fidelización para restaurantes y cafés cuya tarjeta de sellos vive dentro de Apple Wallet o Google Wallet, sin que el cliente instale ninguna app. El cliente escanea un QR, deja su nombre y correo, y la tarjeta queda guardada. El negocio da sellos con la cámara de su propio celular, desde un escáner web (PWA), y envía mensajes que aparecen en la pantalla del cliente.

**Propuesta de valor**

- **Cero fricción para el cliente:** QR o link, 20 segundos, sin descarga ni contraseña.
- **Cero hardware para el negocio:** el celular del cajero es el escáner; el panel se abre con Google.
- **Canal propio de recompra:** mensajes y avisos por cercanía sin costo por mensaje, sin correo ni app.
- **Datos del negocio:** clientes exportables a CSV en cualquier momento, también al irse.

**Qué NO es (en el MVP)**

- No es un POS ni un sistema de pagos.
- No es una app nativa ni requiere una.
- No es un programa de puntos por monto de compra: parte de sellos por visita.

**Mi recomendación de enfoque:** construir un único backend que emita y actualice pases para ambas wallets, un escáner PWA para el negocio y un panel web con personalización de marca. El diferenciador frente a competidores como Almendro es la **personalización profunda** (figuras de sello, colores, logo, reglas de recompensa) y el **aviso por cercanía configurable**, con límites técnicos explicados con honestidad (sección 6).

## 2. Problema y usuarios

Las tarjetas de cartón se pierden, no dan datos y no permiten volver a contactar al cliente. Las apps de fidelización fallan porque nadie descarga una app por un café. El restaurante necesita un sello que el cliente ya lleve en el bolsillo y un canal directo para que vuelva.

| Persona | Quién es | Qué necesita | Qué no tolera |
| --- | --- | --- | --- |
| Dueño / administrador | Dueño o gerente de 1 a 10 locales | Ver clientes y visitas, enviar mensajes, configurar recompensas y marca, exportar datos | Contraseñas, instalar software, pagar por mensaje |
| Cajero / mesero | Personal en mostrador | Dar un sello en menos de 5 segundos con su celular | Procesos de más de 2 toques, depender de la señal |
| Cliente final | Comensal, con iPhone o Android, a veces celular viejo | Guardar la tarjeta en 20 segundos y ver su avance | Descargar apps, crear cuentas, recibir spam |

**Restricciones del contexto:** conectividad irregular dentro de locales, celulares de gama baja, clientes sin wallet o sin correo a mano, y personal con alta rotación (el escáner debe enseñarse en un minuto).

## 3. Objetivos, métricas y alcance

El MVP debe permitir que un restaurante real empiece a dar sellos el mismo día que se registra, sin soporte humano.

**Métricas de éxito** (metas iniciales a validar con un piloto de 5 a 10 locales)

| Métrica | Meta del piloto |
| --- | --- |
| Tiempo de alta del cliente (QR → tarjeta guardada) | Menos de 30 s |
| Tasa de escaneo que termina en tarjeta instalada | Más de 70 % |
| Tiempo de dar un sello | Menos de 5 s |
| Tiempo de alta de un negocio (login → primer QR impreso) | Menos de 10 min |
| Clientes que completan una tarjeta y vuelven por el premio | Más de 35 % |
| Visitas de clientes con tarjeta frente a antes del programa | +20 % a 90 días |

**Alcance por fases**

| Fase | Incluye |
| --- | --- |
| MVP (fase 1) | Login con Google, QR de alta, pases en Apple y Google Wallet, escáner PWA, búsqueda manual, sello e historial, premio, panel básico, mensajes masivos, exportar CSV |
| Fase 2 | Aviso por cercanía (geocerca), personalización avanzada (figuras, colores, logo, imagen del sello), segmentos y mensajes programados, varios locales |
| Fase 3 | Cupones y niveles, referidos, reportes de retención, integraciones con POS, roles de equipo, marca blanca |

## 4. Flujos principales

**Flujo A — Alta del cliente (QR → tarjeta)**

1. El cliente escanea el QR del mostrador o abre el link corto del negocio.
2. Una página web ligera pide nombre y correo (celular opcional) y un consentimiento claro para recibir mensajes y avisos por cercanía.
3. El servidor crea al cliente y genera el pase firmado con un identificador único.
4. La página detecta el sistema: iPhone muestra «Agregar a Apple Wallet»; Android muestra «Guardar en Google Wallet»; otros reciben el enlace al pase en PDF/imagen con QR.
5. La tarjeta queda en el wallet con 0 sellos.

**Flujo B — Dar un sello**

1. El cajero abre el escáner (PWA) con su sesión de Google ya iniciada.
2. Apunta la cámara al QR del pase del cliente.
3. La pantalla muestra nombre y avance («María G. · Lleva 3 de 8») y el botón **Dar sello**.
4. Al confirmar, el servidor suma el sello y actualiza el pase; el cliente ve «+1 sello, lleva 4 de 8» en segundos.
5. Al llegar a la meta, el cajero ve «Premio listo» y lo marca como canjeado; la tarjeta se reinicia.

**Flujo C — Mensaje masivo**

1. El dueño escribe el mensaje (con contador de caracteres y consejo de brevedad) y elige destinatarios.
2. Confirma el envío; el servidor actualiza los pases y envía el aviso a cada wallet.
3. El panel muestra «Enviada» y cuántos pases fueron notificados.

**Casos borde**

| Situación | Comportamiento |
| --- | --- |
| Cliente sin wallet o con celular viejo | Se busca por nombre, correo o celular en el escáner y se da el sello igual; la visita no se pierde |
| Sin señal en el celular del cliente | La tarjeta se ve offline (está guardada en el teléfono); el sello se sincroniza al volver la señal |
| Sin señal en el celular del cajero | El escáner PWA guarda el sello en cola local y lo envía al reconectar; el panel marca «pendiente de sincronizar» |
| Doble escaneo accidental | Bloqueo por ventana de tiempo (por ejemplo 60 s o configurable por negocio) y mensaje de confirmación |
| Cliente borra la tarjeta | Se conserva en la base; puede reinstalarla desde el link o el correo y recupera su avance |
| Fraude de sellos por personal | Registro de quién dio cada sello, límite diario por cliente y alertas en el panel |

## 5. Requisitos funcionales

Prioridad: **P0** = MVP, **P1** = fase 2, **P2** = fase 3.

| ID | Módulo | Requisito | Prioridad |
| --- | --- | --- | --- |
| F1 | Alta de cliente | Página pública por negocio con nombre, correo y celular opcional; botón correcto según sistema | P0 |
| F2 | Alta de cliente | Consentimiento explícito para mensajes y ubicación, guardado con fecha | P0 |
| F3 | Pases | Emitir pase de Apple Wallet (.pkpass firmado) y de Google Wallet (clase + objeto) | P0 |
| F4 | Pases | Actualizar sellos en el pase y mostrar el cambio en segundos | P0 |
| F5 | Pases | Cada pase lleva un QR con un identificador firmado, no el dato personal | P0 |
| F6 | Escáner | PWA que usa la cámara del celular, instalable en pantalla de inicio, con sesión de Google | P0 |
| F7 | Escáner | Búsqueda manual por nombre, correo o celular | P0 |
| F8 | Escáner | Cola offline de sellos con sincronización automática | P1 |
| F9 | Sellos y premios | Meta de sellos configurable (por ejemplo 8), premio descrito en texto y canje con registro | P0 |
| F10 | Sellos y premios | Reglas: sellos por visita, vencimiento, límite diario, premio por niveles | P1 |
| F11 | Panel | Login solo con Google (sin contraseñas); lista de clientes, visitas y sellos del día | P0 |
| F12 | Panel | Exportar clientes e historial a CSV, en cualquier momento | P0 |
| F13 | Mensajes | Mensaje masivo con contador de caracteres, vista previa tipo celular y confirmación «Enviada» | P0 |
| F14 | Mensajes | Segmentos (nuevos, inactivos 30 días, cerca de premio) y programación | P1 |
| F15 | Cercanía | Registrar la ubicación del local y configurar el aviso de cercanía con texto propio | P1 |
| F16 | Personalización | Logo, colores, imagen de fondo, figura del sello (taza, estrella, círculo, ícono propio) y cantidad de casillas | P1 |
| F17 | Personalización | Vista previa en vivo del pase en iPhone y Android mientras se edita | P1 |
| F18 | Equipo | Roles: dueño, administrador, cajero (solo escáner) | P2 |
| F19 | Multi-local | Varios locales bajo una misma cuenta, con tarjeta compartida o por local | P2 |

## 6. Viabilidad técnica y límites reales de las wallets

Todo lo del pedido se puede lograr sin app propia, pero Apple y Google controlan cómo y cuándo se muestran los avisos. Esta sección fija expectativas honestas. Las cifras son aproximadas, de memoria, y deben validarse contra la documentación oficial de Apple Wallet y Google Wallet API antes de comprometer promesas comerciales.

| Capacidad | Apple Wallet | Google Wallet | Implicación para el producto |
| --- | --- | --- | --- |
| Tarjeta sin instalar app | Sí, archivo .pkpass desde un link | Sí, enlace «Guardar en Google Wallet» | Cumple la promesa central |
| Verse sin internet | Sí, el pase queda guardado en el teléfono | Sí, queda en caché | El sello se ve cuando sincroniza |
| Actualizar sellos | Push silencioso (APNs) y el teléfono descarga el pase nuevo | Llamada a la API que modifica el objeto | Sin costo por mensaje; requiere servidor |
| Mensaje masivo | Aparece como notificación al cambiar un campo con texto de cambio | Mensajes del objeto o de la clase; límite de avisos con notificación por pase | No es una notificación push libre: hay límites y no se garantiza hora exacta |
| Aviso por cercanía | Hasta unos 10 puntos por pase; la distancia máxima es configurable | Puntos de ubicación por pase; Google decide el radio y la frecuencia | **El radio exacto de 400 m es fiable en Apple, no controlable en Android** |
| Requisito del cliente | Ubicación del wallet activada | Ubicación activada y wallet con permisos | Los avisos por cercanía solo llegan a quien tenga la ubicación habilitada |
| Costo de emisor | Cuenta de desarrollador de Apple (aprox. 99 USD/año) y certificado de pases | Cuenta de emisor de Google Wallet (gratuita, con aprobación) | Costo fijo bajo, independiente del número de mensajes |
| Imagen del sello | Se genera una imagen (strip) por cada conteo y se reemplaza al actualizar | Imagen principal o módulos de texto; menos libertad de diseño | La figura del sello debe diseñarse dos veces |

**Decisiones derivadas**

- **Aviso por cercanía:** se llama «recordatorio por ubicación» en el producto y se presenta como una sugerencia que el wallet muestra en pantalla de bloqueo, no como una garantía de aviso a 400 m. En Apple se configura el radio; en Android se registra la ubicación del local y se acepta el comportamiento de Google.
- **Mensajes masivos:** se envían actualizando un campo del pase («Último mensaje») con aviso de cambio. El panel debe informar cuántos pases fueron actualizados, no cuántos clientes lo vieron.
- **Clientes sin wallet:** se les ofrece una versión web de la tarjeta (link con QR) para que nunca queden fuera del programa.
- **Validar antes de construir:** una prueba de concepto de 1 semana con un pase real en un iPhone y un Android para medir latencia de sello, aviso por cercanía y mensaje masivo.

## 7. Arquitectura, datos y seguridad

Un solo backend multi-negocio sirve a tres clientes web: la página pública de alta, el escáner PWA y el panel. Ninguno requiere instalación desde una tienda de apps.

| Componente | Función | Tecnología sugerida |
| --- | --- | --- |
| Página de alta | Formulario del cliente y entrega del pase | Web ligera (Next.js o similar), rápida en celulares viejos |
| Escáner PWA | Cámara, búsqueda, cola offline | PWA con Service Worker e IndexedDB |
| Panel del negocio | Clientes, mensajes, personalización, CSV | Web app con login de Google (OAuth) |
| API | Reglas de sellos, premios, mensajes, multi-negocio | Backend en Node o Python con base relacional |
| Servicio de pases | Firma y genera .pkpass; actualiza objetos de Google Wallet | Módulo propio, certificados guardados en un gestor de secretos |
| Servicio de notificaciones | Push a Apple (APNs) y llamadas a Google Wallet API | Cola de trabajos con reintentos |
| Generador de imágenes | Crea la imagen del sello según el conteo y la marca | Servicio de render de imágenes con caché |
| Base de datos | Negocios, clientes, pases, sellos, mensajes | PostgreSQL con aislamiento por negocio |

**Modelo de datos (entidades principales)**

- **Negocio:** nombre, logo, colores, ubicación, configuración de tarjeta, dueño.
- **Cliente:** nombre, correo, celular opcional, consentimientos con fecha, negocio.
- **Pase:** identificador firmado, plataforma, token del dispositivo, sellos actuales, estado.
- **Sello:** pase, fecha, quién lo dio, origen (escáner o búsqueda manual), estado de sincronización.
- **Premio:** pase, fecha de canje, quién lo canjeó.
- **Mensaje:** texto, fecha, destinatarios, resultado de envío.

**Seguridad y privacidad**

- **Login con Google:** OAuth, sin guardar contraseñas; opción de restringir el panel a dominios o correos autorizados.
- **QR seguro:** el QR contiene un identificador firmado y aleatorio, nunca el correo ni el celular; el servidor valida cada escaneo.
- **Anti-fraude:** registro de quién da cada sello, límite por ventana de tiempo y reporte de anomalías.
- **Datos del negocio:** exportación CSV completa y borrado a petición, incluido el día que el negocio se vaya.
- **Privacidad del cliente:** consentimiento explícito para mensajes y ubicación; la ubicación del cliente nunca se envía al servidor, la gestiona el wallet. Cumplir la ley de protección de datos aplicable (en Colombia, la Ley 1581 de 2012) con política de tratamiento visible.
- **Operación:** copias de seguridad, cifrado en tránsito y en reposo, y registro de auditoría.

## 8. Diseño visual y UX

**Principio:** tres superficies, tres niveles de complejidad. El cliente ve una sola pantalla simple; el cajero, dos toques; el dueño, un panel completo pero ordenado.

| Superficie | Pantallas clave | Reglas de diseño |
| --- | --- | --- |
| Cliente (web de alta) | Bienvenida con la marca, formulario de 2 campos, botón de wallet, confirmación | Una sola acción por pantalla, botones de 48 px o más, carga menor a 2 s en 3G |
| Escáner (PWA) | Cámara, resultado con nombre y avance, «Dar sello», búsqueda, estado de sincronización | Contraste alto, una mano, vibración y sonido de confirmación, funciona con luz baja |
| Panel | Inicio con métricas, clientes, mensajes con vista previa de celular, personalización, ajustes, exportar | Navegación lateral corta, vista previa en vivo, lenguaje sin tecnicismos |

**Sistema de personalización de la tarjeta (fase 2)**

- **Marca:** logo, color de fondo y de texto, imagen de cabecera, con verificación automática de contraste.
- **Sellos:** figura (taza, estrella, círculo o ícono propio), cantidad de casillas (de 5 a 12), color de casilla llena y vacía, y posición de la figura de premio.
- **Recompensas:** premio final, premios intermedios, vencimiento y texto de canje.
- **Avisos:** logo e ícono del aviso, texto de cercanía y de mensajes, con plantillas listas («2x1 hasta las 5 pm»).
- **Vista previa:** simulación del pase en iPhone y Android a la vez, con el aviso tal como se vería en pantalla de bloqueo.
- **Límites visibles:** el editor explica qué diferencias de formato hay entre Apple y Google para evitar sorpresas.

**Accesibilidad y localización:** español como idioma principal, textos legibles (16 px o más), alternativas de texto en imágenes y soporte de lector de pantalla en el panel.

## 9. Negocio, riesgos, hoja de ruta y preguntas abiertas

**Modelo de negocio sugerido:** suscripción mensual por local, con un plan básico (sellos y panel) y uno completo (mensajes, cercanía y personalización avanzada). Sin cobro por mensaje, porque el costo marginal es casi nulo. Costos fijos principales: cuenta de desarrollador de Apple, servidor, base de datos y generación de imágenes.

**Riesgos**

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Apple o Google cambian reglas de avisos o geocercas | Alto | Prueba de concepto temprana, comunicación honesta del límite y no prometer 400 m exactos |
| El mensaje masivo no se percibe como notificación inmediata | Alto | Explicar el comportamiento al negocio y medir «pases actualizados» |
| Cajeros no adoptan el escáner | Medio | Flujo de 2 toques, capacitación de 1 minuto y modo offline |
| Clientes rechazan la ubicación | Medio | Consentimiento claro, valor visible («te avisamos cuando haya promoción») |
| Fraude de sellos por parte del personal | Medio | Registro por usuario, límites y reportes de anomalías |
| Competencia directa con productos similares | Medio | Diferenciarse con personalización profunda y exportación de datos libre |

**Hoja de ruta (estimada)**

1. **Semanas 1–2:** prueba de concepto de pases en iPhone y Android; medir latencia, mensaje y cercanía.
2. **Semanas 3–8:** MVP con alta por QR, pases, escáner PWA, panel básico, mensajes y CSV.
3. **Semanas 9–12:** piloto en 5 a 10 locales, ajuste con retroalimentación real.
4. **Meses 4–5:** fase 2 con cercanía, personalización avanzada y segmentos.
5. **Mes 6 en adelante:** fase 3 con multi-local, roles e integraciones.

**Preguntas abiertas**

- [ ] ¿El primer mercado es solo Colombia o varios países? Afecta idioma, moneda y ley de datos.
- [ ] ¿La tarjeta es por local o compartida entre varios locales de la misma marca?
- [ ] ¿Se cobrará suscripción fija o por volumen de clientes?
- [ ] ¿Se ofrecerá marca blanca para agencias o solo cuenta directa del restaurante?
- [ ] ¿Quién imprime y entrega el QR del mostrador: el negocio o el proveedor?

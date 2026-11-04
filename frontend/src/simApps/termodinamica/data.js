export const G = 9.81;
export const R = 8.314;

export const MATERIALES = {
  agua: { nombre: 'Agua', c: 4186, densidad: 1000, simbolo: 'H₂O', emoji: '💧' },
  aceite: { nombre: 'Aceite de cocina', c: 2000, densidad: 920, simbolo: '—', emoji: '🫒' },
  hielo: { nombre: 'Hielo', c: 2090, densidad: 920, simbolo: 'H₂O (s)', emoji: '🧊' },
  aluminio: { nombre: 'Aluminio', c: 900, densidad: 2700, simbolo: 'Al', emoji: '🥫' },
  hierro: { nombre: 'Hierro', c: 450, densidad: 7870, simbolo: 'Fe', emoji: '⚙️' },
  cobre: { nombre: 'Cobre', c: 385, densidad: 8960, simbolo: 'Cu', emoji: '🟠' },
};

export const MODULOS = [
  { slug: 'calor-temperatura', n: 1, titulo: 'Calor y temperatura', nivel: 'Nivel 1 · Conceptos', dif: 'Básico', desc: 'Diferencia entre calor y temperatura, escalas y equilibrio térmico.', meta: 'Comprender la diferencia entre calor y temperatura y su relación con el movimiento de las partículas.' },
  { slug: 'transferencia', n: 2, titulo: 'Transferencia del calor', nivel: 'Nivel 1 · Conceptos', dif: 'Básico', desc: 'Conducción, convección y radiación: las tres formas de viajar el calor.', meta: 'Identificar cómo se transfiere el calor en cada mecanismo con ejemplos de la vida diaria.' },
  { slug: 'energia-termica', n: 3, titulo: 'Calor y energía térmica', nivel: 'Nivel 1 · Conceptos', dif: 'Básico', desc: 'El calor como transferencia de energía: Q = m·c·ΔT.', meta: 'Analizar cómo la masa, el material y el cambio de temperatura influyen en la energía transferida.' },
  { slug: 'equivalente-mecanico', n: 4, titulo: 'Equivalente mecánico del calor', nivel: 'Nivel 2 · Transformación', dif: 'Intermedio', desc: 'Experimento de Joule: el trabajo mecánico se transforma en calor (1 cal ≈ 4,186 J).', meta: 'Relacionar trabajo mecánico y energía térmica mediante el aparato de Joule.' },
  { slug: 'ley-cero', n: 5, titulo: 'Ley cero de la termodinámica', nivel: 'Nivel 3 · Leyes', dif: 'Básico', desc: 'El equilibrio térmico y su transitividad entre cuerpos.', meta: 'Comprender el equilibrio térmico y su propiedad transitiva.' },
  { slug: 'primera-ley', n: 6, titulo: 'Primera ley de la termodinámica', nivel: 'Nivel 3 · Leyes', dif: 'Intermedio', desc: 'Conservación de la energía: ΔU = Q − W.', meta: 'Comprender la conservación de la energía en los sistemas termodinámicos.' },
  { slug: 'segunda-ley', n: 7, titulo: 'Segunda ley de la termodinámica', nivel: 'Nivel 3 · Leyes', dif: 'Intermedio', desc: 'Dirección de los procesos y rendimiento de las máquinas térmicas.', meta: 'Comprender la dirección natural de los procesos y por qué no todo el calor se convierte en trabajo.' },
  { slug: 'tercera-ley', n: 8, titulo: 'Tercera ley de la termodinámica', nivel: 'Nivel 3 · Leyes', dif: 'Intermedio', desc: 'El cero absoluto (0 K = −273,15 °C) y el límite del movimiento térmico.', meta: 'Comprender el comportamiento del sistema cuando T se aproxima a 0 K.' },
  { slug: 'procesos', n: 9, titulo: 'Procesos termodinámicos', nivel: 'Nivel 4 · Aplicación', dif: 'Avanzado', desc: 'Isotérmico, isobárico, isocórico y adiabático en un cilindro.', meta: 'Comparar los cuatro procesos termodinámicos y sus gráficas P-V.' },
  { slug: 'entropia', n: 10, titulo: 'Entropía', nivel: 'Nivel 5 · Profundización', dif: 'Avanzado', desc: 'Distribución de la energía y dirección de los procesos espontáneos.', meta: 'Comprender la entropía como distribución de energía y el sentido de la segunda ley.' },
  { slug: 'laboratorio', n: 11, titulo: 'Laboratorio de termodinámica', nivel: 'Nivel 6 · Integración', dif: 'Variable', desc: 'Experimentos con materiales, tabla de datos y gráficas.', meta: 'Experimentar libremente y registrar datos como en un laboratorio real.' },
  { slug: 'actividades', n: 12, titulo: 'Actividades y desafíos', nivel: 'Nivel 6 · Integración', dif: 'Variable', desc: 'Situaciones cotidianas y retos para aplicar lo aprendido.', meta: 'Aplicar los conceptos a situaciones de la vida diaria.' },
  { slug: 'evaluacion', n: 13, titulo: 'Evaluación final', nivel: 'Nivel 6 · Integración', dif: 'Avanzado', desc: '20 preguntas con puntaje, por temas.', meta: 'Evaluar la comprensión integral de la termodinámica.' },
  { slug: 'glosario', n: 14, titulo: 'Glosario', nivel: 'Referencia', dif: '—', desc: 'Todos los términos con definición y ejemplo.', meta: 'Consultar con rapidez los conceptos clave.' },
  { slug: 'recursos', n: 15, titulo: 'Recursos para el estudiante', nivel: 'Referencia', dif: '—', desc: 'Resumen, fórmulas, unidades, ejemplos y ficha de laboratorio.', meta: 'Contar con material de consulta para repasar y estudiar.' },
];

export const CONSTANTES = [
  { nombre: 'Calor de vaporización del agua', simbolo: 'Lv', valor: '2,26 × 10⁶ J/kg', unidad: 'J/kg' },
  { nombre: 'Calor de fusión del agua', simbolo: 'Lf', valor: '3,34 × 10⁵ J/kg', unidad: 'J/kg' },
  { nombre: 'Calor específico del agua', simbolo: 'c', valor: '4 186', unidad: 'J/(kg·K)' },
  { nombre: 'Conductividad del cobre', simbolo: 'k', valor: '~400', unidad: 'W/(m·K)' },
  { nombre: 'Constante de los gases ideales', simbolo: 'R', valor: '8,314', unidad: 'J/(mol·K)' },
  { nombre: 'Gravedad (superficie)', simbolo: 'g', valor: '9,81', unidad: 'm/s²' },
];

export const UNIDADES = [
  { nombre: 'Kelvin', simbolo: 'K', uso: 'Temperatura termodinámica (SI)' },
  { nombre: 'Grado Celsius', simbolo: '°C', uso: 'Temperatura cotidiana', conv: '°C = K − 273,15' },
  { nombre: 'Joule', simbolo: 'J', uso: 'Energía, trabajo, calor (SI)', conv: '1 cal = 4,186 J' },
  { nombre: 'Caloría', simbolo: 'cal', uso: 'Calor (nutrición usa kcal)' },
  { nombre: 'Watt', simbolo: 'W', uso: 'Potencia (SI)', conv: '1 W = 1 J/s' },
  { nombre: 'Pascal', simbolo: 'Pa', uso: 'Presión (SI)', conv: '1 atm = 101 325 Pa' },
  { nombre: 'Newton', simbolo: 'N', uso: 'Fuerza (SI)' },
  { nombre: 'Metro cúbico', simbolo: 'm³', uso: 'Volumen (SI)' },
  { nombre: 'Kilogramo', simbolo: 'kg', uso: 'Masa (SI)' },
];

export const GLOSARIO = [
  { termino: 'Calor', def: 'Energía térmica que se transfiere entre cuerpos a distinta temperatura.', ejemplo: 'La llama le transfiere calor al agua de la pava.' },
  { termino: 'Temperatura', def: 'Medida del grado de agitación de las partículas de un cuerpo.', ejemplo: 'Un termómetro marca 40 °C en un día caluroso.' },
  { termino: 'Energía térmica', def: 'Energía interna asociada al movimiento aleatorio de las partículas.', ejemplo: 'A más temperatura, mayor energía térmica.' },
  { termino: 'Energía interna', def: 'Suma de las energías cinética y potencial de las partículas.', ejemplo: 'Su cambio se escribe ΔU.' },
  { termino: 'Trabajo', def: 'Energía transferida por una fuerza que actúa a lo largo de un desplazamiento.', ejemplo: 'El pistón empuja al gas y realiza trabajo.' },
  { termino: 'Equilibrio térmico', def: 'Estado en el que dos cuerpos tienen la misma temperatura y no hay flujo neto de calor.', ejemplo: 'El té y la taza alcanzan la misma temperatura.' },
  { termino: 'Sistema termodinámico', def: 'Porción del universo que se estudia (gas en un cilindro, un recipiente…).', ejemplo: 'El agua en la pava es tu sistema.' },
  { termino: 'Entorno', def: 'Todo lo que no forma parte del sistema.', ejemplo: 'El aire que rodea la pava es el entorno.' },
  { termino: 'Presión', def: 'Fuerza por unidad de superficie aplicada por un fluido.', ejemplo: 'Medida en atmósferas o pascales.' },
  { termino: 'Volumen', def: 'Espacio que ocupa un cuerpo.', ejemplo: 'Se mide en m³ o litros.' },
  { termino: 'Calor específico', def: 'Energía necesaria para elevar 1 kg de un material en 1 K.', ejemplo: 'El agua calienta más lento porque su c es alto.' },
  { termino: 'Proceso isotérmico', def: 'Proceso a temperatura constante (P·V = cte).', ejemplo: 'Expansión lenta con la llama justa para no cambiar T.' },
  { termino: 'Proceso isobárico', def: 'Proceso a presión constante.', ejemplo: 'Agua hirviendo destapada: la presión atmosférica no cambia.' },
  { termino: 'Proceso isocórico', def: 'Proceso a volumen constante.', ejemplo: 'Calentar un gas en un recipiente rígido.' },
  { termino: 'Proceso adiabático', def: 'Proceso sin intercambio de calor (Q = 0).', ejemplo: 'Compresión rápida de una bomba de inflar.' },
  { termino: 'Entropía', def: 'Magnitud que mide la distribución de la energía y la dirección de los procesos espontáneos.', ejemplo: 'La entropía de un sistema aislado no disminuye.' },
  { termino: 'Máquina térmica', def: 'Dispositivo que convierte calor en trabajo, cediendo calor al foco frío.', ejemplo: 'El motor de un automóvil.' },
  { termino: 'Rendimiento', def: 'Fracción del calor recibido que se convierte en trabajo (η = W/Qₕ).', ejemplo: 'Un motor eficiente aprovecha más el calor.' },
  { termino: 'Cero absoluto', def: 'Temperatura más baja posible, 0 K = −273,15 °C.', ejemplo: 'Las partículas quedan casi sin movimiento.' },
];

export const PREGUNTAS = [
  { seccion: 'Calor y temperatura', texto: 'El calor y la temperatura son lo mismo.', tipo: 'vf', correcto: false, explicacion: 'El calor es energía en tránsito y la temperatura mide la agitación de las partículas.' },
  { seccion: 'Transferencia del calor', texto: 'La cuchara de metal dentro de la sopa caliente se calienta porque el calor…', tipo: 'mc', opciones: ['Viaja por el metal por contacto directo (conducción)', 'Sube con el aire de la sopa (convección)', 'Llega en forma de ondas (radiación)'], correcto: 0, explicacion: 'En los sólidos el calor se transmite por conducción, partícula a partícula.' },
  { seccion: 'Transferencia del calor', texto: 'El agua de la olla "da vueltas" al hervir: es un ejemplo de…', tipo: 'mc', opciones: ['Conducción', 'Convección', 'Radiación'], correcto: 1, explicacion: 'El fluido caliente sube por menor densidad y el frío baja, formando corrientes de convección.' },
  { seccion: 'Transferencia del calor', texto: 'El calor del Sol llega a la Tierra aunque el espacio sea vacío porque se propaga por…', tipo: 'mc', opciones: ['Conducción', 'Convección', 'Radiación'], correcto: 2, explicacion: 'La radiación son ondas electromagnéticas que no necesitan medio material.' },
  { seccion: 'Transferencia del calor', texto: 'La radiación necesita un medio material (aire, agua o sólido) para propagarse.', tipo: 'vf', correcto: false, explicacion: 'La radiación viaja por ondas electromagnéticas y no necesita medio: por eso el Sol nos calienta a través del vacío.' },
  { seccion: 'Calor y temperatura', texto: '¿Qué magnitud mide el grado de agitación de las partículas?', tipo: 'mc', opciones: ['Calor', 'Temperatura', 'Entalpía', 'Presión'], pista: 'Es lo que marca el termómetro.', correcto: 1, explicacion: 'La temperatura mide la energía cinética media de las partículas.' },
  { seccion: 'Calor y temperatura', texto: 'Cuando dos cuerpos a distinta temperatura se tocan, el calor fluye…', tipo: 'mc', opciones: ['Del más frío al más caliente', 'Del más caliente al más frío', 'Siempre por igual', 'No fluye'], correcto: 1, explicacion: 'La energía fluye hasta alcanzar el equilibrio térmico.' },
  { seccion: 'Calor y temperatura', texto: '0 °C equivale a…', tipo: 'mc', opciones: ['273,15 K', '0 K', '−273,15 K', '373,15 K'], correcto: 0, explicacion: 'T(K) = T(°C) + 273,15.' },
  { seccion: 'Calor y energía térmica', texto: 'La ecuación del calor sensible es Q = m·c·ΔT.', tipo: 'vf', correcto: true, explicacion: 'Q depende de la masa, el calor específico y la variación de temperatura.' },
  { seccion: 'Calor y energía térmica', texto: 'Con la misma masa y potencia, ¿qué material aumenta más lento su temperatura?', tipo: 'mc', opciones: ['Cobre', 'Hierro', 'Agua', 'Aceite'], correcto: 2, explicacion: 'El agua tiene el mayor calor específico (~4186 J/(kg·K)).' },
  { seccion: 'Calor y energía térmica', texto: '¿Cuánto calor se necesita para elevar 2 kg de agua de 20 °C a 70 °C? (c = 4186)', tipo: 'num', correcto: 418600, unidad: 'J', explicacion: 'Q = 2 · 4186 · 50 = 418 600 J.' },
  { seccion: 'Equivalente mecánico', texto: 'El experimento de Joule demostró que el trabajo mecánico puede convertirse en calor.', tipo: 'vf', correcto: true, explicacion: 'Al girar las paletas, el agua se calienta por fricción.' },
  { seccion: 'Equivalente mecánico', texto: '1 cal equivale aproximadamente a…', tipo: 'mc', opciones: ['4,186 J', '1 J', '4186 J', '9,81 J'], correcto: 0, explicacion: 'Es la equivalencia que determinó Joule.' },
  { seccion: 'Leyes de la termodinámica', texto: 'Si A está en equilibrio con B y B con C, entonces A está en equilibrio con C. Esta es la ley…', tipo: 'mc', opciones: ['Primera', 'Segunda', 'Cero', 'Tercera'], correcto: 2, explicacion: 'La ley cero establece la transitividad del equilibrio térmico.' },
  { seccion: 'Leyes de la termodinámica', texto: 'Se suministran 500 J de calor a un gas y éste realiza 200 J de trabajo. Su ΔU vale…', tipo: 'num', correcto: 300, unidad: 'J', explicacion: 'ΔU = Q − W = 500 − 200 = 300 J.' },
  { seccion: 'Procesos termodinámicos', texto: 'En un proceso isotérmico de un gas ideal…', tipo: 'mc', opciones: ['P varía pero P·V es constante', 'La presión es constante', 'V el volumen es constante', 'Q = 0'], correcto: 0, explicacion: 'T constante ⇒ P·V = n·R·T = constante.' },
  { seccion: 'Procesos termodinámicos', texto: 'Calentar un gas en un recipiente rígido es un proceso…', tipo: 'mc', opciones: ['Isotérmico', 'Isocórico', 'Isobárico', 'Adiabático'], correcto: 1, explicacion: 'Volumen constante ⇒ presión y temperatura aumentan.' },
  { seccion: 'Procesos termodinámicos', texto: 'En un proceso adiabático, el calor intercambiado es cero.', tipo: 'vf', correcto: true, explicacion: 'No hay transferencia de calor; la energía cambia por trabajo.' },
  { seccion: 'Procesos termodinámicos', texto: 'Hervir agua destapada a presión atmosférica se aproxima a un proceso…', tipo: 'mc', opciones: ['Isotérmico', 'Isobárico', 'Isocórico', 'Adiabático'], correcto: 1, explicacion: 'La presión es la atmosférica y no cambia.' },
  { seccion: 'Entropía', texto: 'Para un proceso reversible, ΔS = Q_rev / T.', tipo: 'vf', correcto: true, explicacion: 'La definición termodinámica clásica de entropía.' },
  { seccion: 'Entropía', texto: 'En un sistema aislado, los procesos espontáneos…', tipo: 'mc', opciones: ['Disminuyen la entropía', 'No cambian la entropía', 'Aumentan la entropía', 'Dependen del observador'], correcto: 2, explicacion: 'La entropía total de un sistema aislado no disminuye jamás.' },
  { seccion: 'Entropía', texto: '¿Por qué un gas expandido a un volumen mayor no vuelve solo a su recipiente original?', tipo: 'mc', opciones: ['Porque pesa más', 'Porque habría que disminuir la entropía, lo que no ocurre espontáneamente', 'Por la gravedad', 'Porque el calor se enfría'], correcto: 1, explicacion: 'La expansión espontánea aumenta la entropía; volver sería disminuirla.' },
  { seccion: 'Integradoras', texto: 'Un motor recibe 1000 J de calor y entrega 250 J de trabajo. Su rendimiento es…', tipo: 'num', correcto: 25, unidad: '%', explicacion: 'η = W/Qₕ = 250/1000 = 25%.' },
  { seccion: 'Integradoras', texto: 'Al aumentar la cantidad de masa de agua que se calienta (misma potencia), su temperatura…', tipo: 'mc', opciones: ['Sube más rápido', 'Sube más lento', 'Igual', 'No sube'], correcto: 1, explicacion: 'Más masa demanda más energía para el mismo ΔT (Q = m·c·ΔT).' },
];

const CAMPO_SECCION = {
  'Calor y temperatura': 'Calor y temperatura',
  'Transferencia del calor': 'Transferencia del calor',
  'Calor y energía térmica': 'Calor y energía térmica',
  'Equivalente mecánico': 'Equivalente mecánico',
  'Leyes de la termodinámica': 'Leyes de la termodinámica',
  'Procesos termodinámicos': 'Procesos termodinámicos',
  'Entropía': 'Entropía',
  'Integradoras': 'Integradoras',
};

export const VAR_TABS = ['Calor y temperatura', 'Calor y energía térmica', 'Equivalente mecánico', 'Leyes de la termodinámica', 'Procesos termodinámicos', 'Entropía'];

export function filtrarPreguntas() {
  return PREGUNTAS;
}

export const Nl = CAMPO_SECCION;

export const GLOSARIO2 = GLOSARIO;

export const ACTIVIDADES = [
  { titulo: 'Hervir agua', emoji: '🍳', texto: 'Estás con la pasta: a fuego fuerte el agua hierve más rápido que a fuego mínimo. Relacionalo con Q = P·t (la potencia es energía por segundo).', pregunta: 'Si aumentás la potencia de la fuente (más llama), el tiempo hasta hervir…', opciones: ['Aumenta', 'Disminuye', 'No cambia'], correcto: 1, explicacion: 'A más potencia, más energía por segundo: se llega antes a los 100 °C. ¡Por eso la olla «grande» hierve más lento si la llama es igual!' },
  { titulo: 'El termo de la abuela', emoji: '🫖', texto: 'El termo mantiene el café caliente por horas. El vacío entre sus paredes casi no deja pasar el calor.', pregunta: 'El espacio vacío entre las paredes del termo bloquea sobre todo…', opciones: ['La radiación sola', 'La conducción y la convección del aire', 'La evaporación del café'], correcto: 1, explicacion: 'El vacío no tiene partículas para conducir ni convectar el calor. La radiación sigue, por eso los termos "buenos" tienen paredes plateadas que la reflejan.' },
  { titulo: 'Refrigerador', emoji: '🧊', texto: 'El refri está más frío adentro que la cocina. Parece que "desobedece" la segunda ley, pero no: usa trabajo para empujar el calor hacia afuera.', pregunta: 'El refrigerador logra que el calor vaya de un lugar frío a uno caliente gracias a…', opciones: ['El trabajo del compresor (motor)', 'Que el frío sube solo por gravedad', 'El hielo que lo mantiene frío'], correcto: 0, explicacion: 'Sin trabajo externo el calor va solo del caliente al frío. El compresor "paga" ese trabajo para moverlo al revés.' },
  { titulo: 'Motor de la moto', emoji: '🏍️', texto: 'El motor quema nafta y parte de ese calor lo convierte en mover la rueda. El resto se va por el escape y el radiador.', pregunta: 'La energía que el motor no logra convertir en movimiento…', opciones: ['Se crea energía nueva automáticamente', 'Se disipa como calor al entorno', 'Se guarda para siempre en el tanque'], correcto: 1, explicacion: 'Por la segunda ley, ninguna máquina convierte todo el calor en trabajo: una parte siempre se cede al foco frío (escape, radiador).' },
  { titulo: 'Inflar la rueda de la bici', emoji: '🚲', texto: 'Al inflar rápido con la bomba, la manguera y la bomba se calientan. Es una compresión rápida, casi sin tiempo para ceder calor.', pregunta: '¿Por qué se calienta el aire al comprimirlo rápido?', opciones: ['Porque tiene tiempo de ceder calor al ambiente', 'Porque el trabajo aumenta su temperatura sin ceder calor (adiabático)', 'Porque el aire pesa más cuando se comprime'], correcto: 1, explicacion: 'En la compresión rápida casi no hay tiempo de transferir calor (proceso adiabático): el trabajo que hacés se convierte en aumento de temperatura.' },
  { titulo: 'Congelar vs. hervir', emoji: '❄️', texto: 'El hielo tarda poco en hacerse en el freezer, pero el agua tarda mucho más en evaporarse en la olla.', pregunta: '¿Qué absorbe más energía: fundir 1 kg de hielo o evaporar 1 kg de agua?', opciones: ['Fundir el hielo', 'Evaporar el agua', 'Los dos por igual'], correcto: 1, explicacion: 'El calor de vaporización del agua (~2,26 MJ/kg) es unas 7 veces mayor que el de fusión (~0,33 MJ/kg).' },
  { titulo: 'Cuchara de madera vs. de metal', emoji: '🥄', texto: 'Revolviendo sopa hirviendo, la cuchara de metal quema al toque y la de madera no. Son distinti bases para el calor.', pregunta: '¿Por qué la cuchara de metal quema y la de madera no?', opciones: ['La madera es mala conductora del calor', 'La madera enfría la sopa mágicamente', 'El metal guarda el frío eternamente'], correcto: 0, explicacion: 'El metal conduce muy bien el calor (hasta la mano) y la madera es aislante: el calor casi no la recorre.' },
  { titulo: 'El mate se enfría soplando', emoji: '🧉', texto: 'Soplás el mate para tomar sin quemarte. El aire sopla la superficie y la evaporación ayuda a bajar la temperatura.', pregunta: 'Al soplar el mate, el calor se va más rápido porque la evaporación del líquido…', opciones: ['Enfría el líquido al quitarle energía', 'Calienta el líquido con el aliento', 'No cambia nada de la temperatura'], correcto: 0, explicacion: 'Al evaporar, las partículas que escapan son las más energéticas y se llevan energía: el resto del líquido queda más frío.' },
  { titulo: 'Playa al atardecer', emoji: '🏖️', texto: 'Al tardecer, la arena ya está fría pero el agua de la playa sigue tibia. El sol calentó a los dos todo el día.', pregunta: 'La arena se enfría antes que el agua porque el agua…', opciones: ['Cambia de temperatura mucho más lento (mayor calor específico)', 'Cambia de temperatura mucho más rápido', 'No recibe el calor del sol'], correcto: 0, explicacion: 'El agua tiene un calor específico muy alto: guarda/cambia energía lento. Por eso el mar "aguanta" el calor del día y las ciudades junto al mar tienen clima parejo.' },
];

export const VIDA_HOME = [
  { slug: 'calor-temperatura', e: '🍵', t: 'Tu té y la cuchara' },
  { slug: 'transferencia', e: '🥄', t: 'La cuchara en la sopa' },
  { slug: 'energia-termica', e: '🍳', t: 'La olla y la llama' },
  { slug: 'equivalente-mecanico', e: '✋', t: 'Frotar las manos' },
  { slug: 'ley-cero', e: '🏠', t: 'Toda la casa igual de fría' },
  { slug: 'primera-ley', e: '🚗', t: 'El motor de la moto' },
  { slug: 'segunda-ley', e: '🍦', t: 'El helado que se derrite' },
  { slug: 'tercera-ley', e: '❄️', t: 'El congelador extremo' },
  { slug: 'procesos', e: '🎈', t: 'El globo al sol' },
  { slug: 'entropia', e: '🥵', t: 'El cuarto que se desordena' },
];

export const HOOKS = {
  'transferencia': {
    vida: ['🥄 "La cuchara de metal quema igual que la sopa (conducción)."', '🌊 "El agua de la olla da vueltas sola cuando hierve (convección)."', '☀️ "El Sol te calienta aunque esté nublado o lejísimos (radiación)."'],
    criollo: 'El calor tiene tres formas de llevar la energía de un lado al otro: tocando (conducción, en sólidos), viajando con el aire o el agua (convección) o como ondas invisibles que ni necesitan aire (radiación). Y cuando dos cosas se tocan mucho tiempo, terminan iguales: eso es el equilibrio térmico.',
    predice: {
      q: 'Metés una cuchara de metal en tu sopa caliente y al rato el mango quema. ¿Por qué?',
      opciones: ['El calor viaja por el metal por contacto directo (conducción)', 'El aire caliente de la sopa sube hasta el mango (convección)', 'La sopa irradia ondas que calientan el mango (radiación)'],
      ok: 0,
      acierto: '¡Exacto! En los sólidos el calor viaja partícula a partícula por contacto: es conducción.',
      fallo: 'El calor del fondo de la sopa sube por la cuchara metal por metal, en contacto directo: conducción.',
    },
    ejemplos: [
      { e: '🍴', t: 'La cuchara metálica en la sopa', d: 'Conducción: el calor viaja por el metal por contacto directo.' },
      { e: '🌊', t: 'El agua que "da vueltas" al hervir', d: 'Convección: el agua caliente sube (menos densa) y la fría baja, formando corrientes.' },
      { e: '☀️', t: 'El calor del Sol llega por el vacío', d: 'Radiación: ondas electromagnéticas que no necesitan aire.' },
      { e: '🪵', t: 'La fogata te calienta sin tocarla', d: 'Radiación: el calor llega a distancia, aunque cierres los ojos lo sentís.' },
    ],
  },
  'calor-temperatura': {
    vida: ['🌞 "Dejé el celular al sol y está caliente, pero el sol no lo tocó."', '🥶 "La gaseosa afuera en verano se entibia sola."', '🥄 "La cuchara de metal queda tan caliente como el té."'],
    criollo: 'El calor es la energía que "viaja" del objeto caliente al frío. La temperatura es el termómetro: marca cuánto se mueven las bolitas invisibles que forman todo. Cuando el calor deja de viajar, los dos quedan "igualados": eso se llama equilibrio térmico.',
    predice: {
      q: 'Dejaste un vaso de gaseosa bien fría afuera, en un día de 30 °C. ¿Qué pasa con la gaseosa?',
      opciones: ['Sube de temperatura hasta igualarse con el ambiente', 'Sigue bajando de temperatura', 'Se mantiene fría siempre'],
      ok: 0,
      acierto: '¡Exacto! La energía del ambiente caliente fluye hacia la gaseosa hasta igualar las temperaturas.',
      fallo: 'Casi… La energía siempre va del más caliente al más frío, por eso la gaseosa se entibia hasta alcanzar el aire.',
    },
    ejemplos: [
      { e: '🥵', t: 'La pava se enfría cuando apagás el fuego', d: 'Deja de entrar energía desde la llama y la pava cede calor al aire hasta igualar su temperatura.' },
      { e: '🔥', t: 'El mango de la olla de metal quema', d: 'El metal conduce el calor hasta tu mano: es un buen conductor. Por eso las ollas tienen mangos de plástico (aislante).' },
      { e: '🐟', t: 'El pescado congelado se descongela solo afuera', d: 'El aire caliente le transfiere calor hasta que la pieza llega a la temperatura ambiente.' },
    ],
  },
  'energia-termica': {
    vida: ['🍳 "La cacerola grande tarda más en hervir que la chiquita con la misma llama."', '🥣 "La sopa se enfría antes en el plato que en la olla."', '🏖️ "El agua de pileta está fresca aunque haga mucho calor."'],
    criollo: 'Para subir la temperatura de algo necesitás energía. A más cantidad (masa) y a más "costoso" de calentar (calor específico), más energía hace falta. El agua es muy costosa de calentar, por eso el mar cambia poco de temperatura entre el día y la noche.',
    predice: {
      q: 'Tenés la misma llama encendida (misma potencia). ¿Qué se calienta primero?',
      opciones: ['Una cucharada de agua en un jarrito', 'Una olla de 3 litros de agua', 'Los dos a la vez'],
      ok: 0,
      acierto: '¡Bien! El jarrito tiene mucha menos masa: con la misma energía por segundo sube su temperatura mucho más rápido.',
      fallo: 'No exactamente… Para calentar más agua se necesita más energía (Q = m·c·ΔT). El jarrito gana esa carrera siempre.',
    },
    ejemplos: [
      { e: '🏖️', t: 'Por qué caminás descalzo en la arena sí y en el asfalto no', d: 'La arena y el asfalto se calientan rápido (bajo calor específico). El agua del mar se mantiene fresca porque le cuesta mucho subir.' },
      { e: '🧊', t: 'Hielo en un vaso grande vs. uno chico', d: 'A más abundancia de líquido, más energía "absorbe" por grado: el hielo se derrite más lento en el vaso grande.' },
      { e: '☕', t: 'El cortado toma temperatura más rápido que el agua', d: 'La leche y el café tienen calor específico cercano al del agua, pero menos masa hace que cambie rápido la temperatura.' },
    ],
  },
  'equivalente-mecanico': {
    vida: ['✋ "Frotás las manos rápido y se calientan."', '🚲 "Frenás en una bajada larga y los frenos quedan calientes."', '🎻 "La cuerda frotada del violín se calienta un poco."'],
    criollo: 'Joule demostró que el movimiento (trabajo) se puede transformar en calor: agitó agua con paletas y vio que subía. Eso dio la "caja de cambio" entre unidades: 1 cal ≈ 4,186 J. Fricción = música, freno y… calentita.',
    predice: {
      q: 'Frotás fuerte y bien rápido tus manos durante 20 segundos. ¿Qué sentís?',
      opciones: ['Que se te calientan las manos', 'Que se te enfrían las manos', 'Que no pasa nada'],
      ok: 0,
      acierto: '¡Sí! El trabajo de frotar se convierte en calor por fricción. Ese es el principio del aparato de Joule.',
      fallo: 'Pensalo al revés: el trabajo que hacés al frotar tiene que ir a algún lado… se convierte en calor.',
    },
    ejemplos: [
      { e: '🪚', t: 'La sierra que corta se calienta', d: 'La fricción de los dientes transforma parte del trabajo en calor: por eso hay que dejar descansar la herramienta.' },
      { e: '⛳', t: 'Los frenos de disco de las bicis y autos', d: 'Al frenar, la energía del movimiento se disipa como calor en los discos.' },
      { e: '🧈', t: 'Batir la crema para hacer manteca', d: 'El trabajo de batir calienta levemente la mezcla: un mini Joule casero.' },
    ],
  },
  'ley-cero': {
    vida: ['🏠 "En invierno, todas las habitaciones de la casa terminan igual de frías."', '🍫 "El chocolate cerca de la ventana soleada se ablanda igual que la mesa caliente."'],
    criollo: 'Es la "regla del valor único": si A está en equilibrio con B y B con C, entonces A y C también están en equilibrio. La temperatura es ese valor que comparten todos. Por eso un solo termómetro te sirve para medir cualquier cosa.',
    predice: {
      q: 'Tenés tres vasos. A y B están a la misma temperatura; B y C también. ¿A y C?',
      opciones: ['Están a la misma temperatura', 'A está más caliente que C', 'No se puede saber'],
      ok: 0,
      acierto: '¡Correcto! Esa es la transitividad: están todos en equilibrio. Es la ley cero.',
      fallo: 'Mirá el patrón: si ambos se igualan con B, no les queda otra que ser iguales entre sí.',
    },
    ejemplos: [
      { e: '🌡️', t: 'Por qué cualquier termómetro sirve para tu frente', d: 'El termómetro alcanza equilibrio con tu cuerpo y te dice esa temperatura compartida.' },
      { e: '🏫', t: 'La sala toda "a la misma temperatura" y solo un a/c', d: 'Con tiempo, el aula entera (pupitres, pisos, aire) llega a un solo valor: equilibrio térmico.' },
      { e: '🧊', t: 'El hielo dentro del vaso de gaseosa', d: 'Todo termina "igualado" a una temperatura intermedia entre el hielo y la gaseosa.' },
    ],
  },
  'primera-ley': {
    vida: ['🚗 "El motor usa nafta (calor) para empujar (trabajo); el resto se va por el radiador."', '🥫 "La gaseosa recién abierta con gas sale más fría que la lata."', '🚲 "La bomba de inflar se calienta al empujar el aire."'],
    criollo: 'La energía no se crea ni se destruye, solo cambia de disfraz. Lo que entra como calor (Q) se usa en empujar (trabajo W) y el resto queda guardado adentro del gas (energía interna ΔU). La fórmula es una "cuenta": ΔU = Q − W.',
    predice: {
      q: 'La niña motor funciona: el calor de la nafta que no se convierte en marcha, ¿a dónde va?',
      opciones: ['Se disipa como calor al entorno (escape, radiador)', 'Se convierte en combustible nuevo', 'Se guarda intacto para la próxima vuelta'],
      ok: 0,
      acierto: '¡Exacto! Por eso el motor "quema" más de la mitad en calor: el resto queda guardado como energía interna o se disipa.',
      fallo: 'No puede aparecer energía de la nada: lo que no se convierte en trabajo sale del motor como calor.',
    },
    ejemplos: [
      { e: '🌡️', t: 'Comprimís el aire de la bomba y se calienta', d: 'El trabajo que hacés aumenta la energía interna (ΔU = Q − W con Q = 0).' },
      { e: '🥶', t: 'El aerosol abierto se enfría al expandirse', d: 'El gas se expande rápido, hace trabajo, y esa energía sale de su energía interna: baja la temperatura.' },
      { e: '☀️', t: 'Una botella de plástico a pleno sol se deforma', d: 'El calor del sol sube la energía interna del gas; si el volumen no cambia (botella rígida), sube la presión.' },
    ],
  },
  'segunda-ley': {
    vida: ['🍦 "El helado se derrite solo, pero la leche no se vuelve helado sin el freezer."', '☕ "El café se enfría solo; nadie vio un café que se calienta solo."', '🧊 "El hielo del vaso se derrite pero el agua no se vuelve a congelar sola."'],
    criollo: 'El calor viaja siempre del más caliente al más frío, y jamás al revés sin "pagar". Las máquinas térmicas (motores) convierten solo PARTE del calor en trabajo y tiran el resto al foco frío. Por eso ninguna máquina es 100 % eficiente.',
    predice: {
      q: 'Sumerís una cuchara fría en tu té caliente. ¿Qué pasa?',
      opciones: ['La cuchara se calienta y el té se enfría un poquito', 'La cuchara calienta el té aún más', 'La cuchara enfría el té hasta 0 °C'],
      ok: 0,
      acierto: '¡Correcto! El calor va del té caliente a la cuchara fría hasta igualarse: esa dirección siempre es igual.',
      fallo: 'Recordá la regla de oro: la energía va del más caliente al más frío.',
    },
    ejemplos: [
      { e: '🍦', t: '¿Por qué el helado se derrite y no se "congela" solo?', d: 'Derretirse aumenta la repartición de la energía; el proceso inverso necesitaría trabajo (freezer).' },
      { e: '🥶', t: 'El aire acondicionado "contradice" la regla… ¿cómo?', d: 'Usa trabajo del compresor exactamente como el refrigerador: impide el camino natural pagando energía.' },
      { e: '🚗', t: 'Por qué el auto necesita radiador', d: 'Debe ceder al aire el calor que no pudo convertir en movimiento (parte obligada por la segunda ley).' },
    ],
  },
  'tercera-ley': {
    vida: ['❄️ "Tu freezer llega a −18 °C… pero nadie en la Tierra llegó a −273,15 °C."', '🧲 "Materiales ultracongelados (superconductores) se vuelven imanes perfectos."', '🚀 "El espacio profundo está a casi −270 °C: casi el cero absoluto."'],
    criollo: 'A 0 K (−273,15 °C) las partículas no se moverían nada. Los laboratorios se acercan "barbaridad", pero llegar exactamente a 0 K es imposible: siempre hace falta sacar un poquito más de energía. Es como bajar una escalera infinita.',
    predice: {
      q: 'A medida que la temperatura baja y se acerca a 0 K, el movimiento de las partículas…',
      opciones: ['Va siendo cada vez más lento y se detendría en 0 K', 'Se vuelve cada vez más rápido', 'No cambia nunca'],
      ok: 0,
      acierto: '¡Exacto! La temperatura ES el movimiento de las partículas. En 0 K no habría movimiento térmico, pero nunca se alcanza del todo.',
      fallo: 'Pensalo al revés que el fuego: el frío "apaga" el movimiento, no lo acelera.',
    },
    ejemplos: [
      { e: '🧲', t: 'Imanes ultrapotentes y trenes que flotan', d: 'Algunos materiales, a temperaturas muy bajas, conducen sin pérdidas (superconductividad): base de los trenes de levitación.' },
      { e: '⏱️', t: 'Relojes atómicos que miden el tiempo con precisión', d: 'Usan átomos enfriados para que su "tic-tac" sea casi perfecto, gracias a que el movimiento se frena.' },
      { e: '🧊', t: 'Nitrógeno líquido en la cocina molecular', d: 'Está a −196 °C, muy cerca del cero absoluto comparado con la heladera. Al contacto, "quema" por el frío extremo.' },
    ],
  },
  procesos: {
    vida: ['🎈 "El globo lleno de aire al sol se estira un poco más."', '🥤 "La gaseosa abierta pierde gas: baja la presión de adentro."', '🚲 "La bomba de la bici se calienta al comprimir rápido."'],
    criollo: 'Los gases se manejan con "recetas": cada proceso congela una magnitud — temperatura (isotérmico), presión (isobárico), volumen (isocórico) o sin calor (adiabático). Si sabés cuál está quieta, podés predecir cómo cambian las otras.',
    predice: {
      q: 'Un globo inflado al sol (poca sombra). El aire de adentro se calienta a presión atmosférica casi igual. ¿Qué le pasa al globo?',
      opciones: ['Se hincha un poco más (aumenta su volumen)', 'Se desinfla', 'Se mantiene igual siempre'],
      ok: 0,
      acierto: '¡Bien! Con presión casi constante (isobárico), al subir la temperatura el volumen crece: el globo se estira.',
      fallo: 'Cuando calentás un gas que puede expandirse libremente, el volumen tiende a crecer (receta isobárica).',
    },
    ejemplos: [
      { e: '🍲', t: 'La olla a presión', d: 'Al taparla, el volumen no cambia casi (isocórico): al calentar suben presión y temperatura, y la comida se cocina más rápido.' },
      { e: '🥤', t: 'El porqué de la efervescencia al abrir la gaseosa', d: 'Al destapar cae mucho la presión; el gas "escapa" (expansión) y parte del líquido se enfría.' },
      { e: '😮', t: 'Respirás y el pecho se mueve', d: 'Al aumentar tu tórax, baja la presión de adentro (Boyle) y entra aire: un proceso que cambia presión y volumen.' },
    ],
  },
  entropia: {
    vida: ['🧦 "Tu cuarto se desordena solo; ordenarlo siempre cuesta energía."', '🎲 "El gas del aroma se reparte por toda la pieza y no vuelve solo a la botella."', '☕ "El té caliente "reparte" su calor al ambiente y nunca lo vuelve a juntar.'],
    criollo: 'La entropía es la "medida del reparto": cuánto se desparrama la energía. Los procesos que pasan solos reparten más (la entropía total sube). Juntar todo otra vez siempre cuesta energía. Por eso el tiempo solo avanza hacia adelante.',
    predice: {
      q: 'Percibiste el aroma de un sachet de lavanda en un rincón. La molécula del aroma…',
      opciones: ['Se reparte por el aire y no vuelve sola al sachet', 'Se queda pegada al sachet siempre', 'Se hace más pesada y cae'],
      ok: 0,
      acierto: '¡Claro! El aroma se dispersa: ese "desparramarse" es el aumento de entropía. Junagarla de vuelta costaría energía.',
      fallo: 'Las partículas se esparcen solas por todo el espacio disponible: nunca regresan a su rinconcito sin ayuda.',
    },
    ejemplos: [
      { e: '🧩', t: 'El rompecabezas sin tapa', d: 'Las piezas "solas" nunca forman el dibujo: ordenar exige energía. Eso es trabajar contra la entropía.' },
      { e: '🔥', t: 'El calor de la llama se "dispersa" por la habitación', d: 'La energía concentrada de la leña se reparte: parte de la definición de entropía es esa repartición.' },
      { e: '🌍', t: 'El clima y los "térmicos"', d: 'La energía del Sol llega concentrada y la Tierra intenta "repartirla" moviendo el aire y el agua: un motor gigante de entropía.' },
    ],
  },
  laboratorio: {
    vida: ['🎨 "Como en una receta: cambiás un ingrediente cada vez para saber qué hace."', '🔍 "Los científicos descubren «reglas» probando hipótesis con experimentos."'],
    criollo: 'Acá sos el/la científica: elegís material y masa, medís, y la tabla calcula solita. Lo importante es el método: PREDECÍ → EXPERIMENTÁ → OBSERVÁ → MIDE → ANALIZÁ → CONCLUÍ.',
    predice: {
      q: 'Calentás dos masas distintas del mismo material con la misma llama. ¿Cuál sube más rápido su temperatura?',
      opciones: ['La de menor masa', 'La de mayor masa', 'Suben igual porque al material es igual'],
      ok: 0,
      acierto: '¡Sí! Con menos masa, la misma energía por segundo produce un salto de temperatura más grande (Q = m·c·ΔT).',
      fallo: 'Casi… la energía se "reparte" entre todas las partículas: cuantas más haya, menos le toca a cada una.',
    },
    ejemplos: [
      { e: '⚗️', t: 'Un laboratorio de verdad también usa "hipótesis"', d: 'Anotás y comprobás: la diferencia es que acá vos controlás y la tabla calcula por vos.' },
      { e: '🍲', t: 'Ajustar la receta de la olla', d: 'Del mismo modo que probás cantidad de sal, acá probás masa/material y observás la curva de temperatura.' },
      { e: '📊', t: 'La tabla y las gráficas hablan por vos', d: 'Los datos juntos te dejan ver la tendencia que después explicás con la fórmula.' },
    ],
  },
  actividades: {
    vida: ['🧉 "Mate, helado, la moto, la pava… la termodinámica está en tu día."', '💡 "Cada situación cotidiana se explica con alguna ley."'],
    criollo: 'Estos son casos reales. Leé cada situación, pensá qué ley aplica y elegí tu respuesta; después revisá la explicación. ¡Es el momento de conectar la teoría con el barrio!',
    ejemplos: [
      { e: '🧉', t: 'El mate se enfría soplando', d: 'La evaporación se lleva las partículas más energéticas: el líquido queda más frío.' },
      { e: '🧊', t: 'El helado que se derrite en la calle', d: 'El aire caliente le cede calor y la segunda ley manda: el proceso no se revierte solo.' },
      { e: '🚲', t: 'La bomba de la bici caliente', d: 'Compresión rápida adiabática: el trabajo va a la temperatura.' },
    ],
  },
  evaluacion: {
    vida: ['📝 "Ya recorriste el camino: hora de medir cuánto entendiste."'],
    criollo: '20 preguntas por temas, con puntaje y sugerencias al final. Si alguna te cuesta, el simulador te marca qué módulo repasar.',
  },
  glosario: {
    vida: ['📖 "¿Qué era la entropía? La buscás acá en segundos."'],
    criollo: 'Todos los términos con definición y un ejemplo de la vida real. Nada de letra chica: directo al punto.',
  },
  recursos: {
    vida: ['🗂️ "Todo junto para repasar: fórmulas, unidades y la ficha de laboratorio."'],
    criollo: 'El "cuadernillo" de la app: resumen, fórmulas, unidades y ejemplos para estudiar antes del examen.',
  },
};

export const ETIQUETAS_FICHA = [
  'Nombre del experimento',
  'Objetivo',
  'Hipótesis',
  'Variables (controlada, dependiente, constantes)',
  'Procedimiento',
  'Datos obtenidos',
  'Gráfica',
  'Análisis',
  'Conclusión',
  'Preguntas y dudas',
];
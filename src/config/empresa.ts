/**
 * Datos de la empresa: única fuente de verdad para textos, pie, contacto y
 * datos estructurados. Lo marcado como `pendiente` se muestra en la web con
 * una etiqueta visible hasta que el cliente lo confirme.
 */

export interface Telefono {
  /** Como se lee en pantalla. */
  texto: string;
  /** Formato internacional para enlaces tel: y datos estructurados. */
  e164: string;
}

export interface Sede {
  nombre: string;
  calle: string;
  referencia?: string;
  cp: string;
  localidad: string;
  provincia: string;
  superficie: number;
  telefonos: Telefono[];
  mapa: string;
}

const tienda: Sede = {
  nombre: 'Tienda y exposición',
  calle: 'Avda. de Fuenlabrada, 57',
  referencia: 'Ctra. Fuenlabrada–Humanes, km 1,200',
  cp: '28970',
  localidad: 'Humanes de Madrid',
  provincia: 'Madrid',
  superficie: 700,
  telefonos: [
    { texto: '91 604 93 82', e164: '+34916049382' },
    { texto: '91 604 06 56', e164: '+34916040656' },
  ],
  mapa: 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Cocinas CMA, Avenida de Fuenlabrada 57, 28970 Humanes de Madrid'),
};

const fabrica: Sede = {
  nombre: 'Fábrica',
  calle: 'Pol. Ind. Requena, Nave 56',
  cp: '45214',
  localidad: 'Cedillo del Condado',
  provincia: 'Toledo',
  superficie: 2000,
  telefonos: [{ texto: '925 50 89 76', e164: '+34925508976' }],
  mapa: 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Polígono Industrial Requena, Nave 56, 45214 Cedillo del Condado, Toledo'),
};

export const empresa = {
  nombre: 'Cocinas CMA',
  razonSocial: 'Cocinas C.M.A. S.L.',
  lema: 'Fábrica de mobiliario de cocinas',
  fundacion: 1992,
  constitucion: '1993-01-13',
  email: 'info@cocinascma.com',
  webActual: 'https://www.cocinascma.com',
  tienda,
  fabrica,

  /** Mapa embebido (no necesita clave de API). Se carga solo si el usuario lo pide. */
  mapaEmbebido:
    'https://maps.google.com/maps?output=embed&z=15&q=' +
    encodeURIComponent('Cocinas CMA, Avenida de Fuenlabrada 57, 28970 Humanes de Madrid'),

  /**
   * PENDIENTE: confirmar el número de WhatsApp (¿un móvil o WhatsApp Business
   * en el fijo de la tienda?). De momento apunta al fijo principal.
   */
  whatsapp: {
    numero: '34916049382',
    mensaje: 'Hola, me gustaría información sobre una cocina a medida.',
    pendiente: true,
  },

  /** PENDIENTE: horario real de la tienda. Valores de ejemplo. */
  horario: {
    pendiente: true,
    filas: [
      { dias: 'Lunes a viernes', horas: '10:00–14:00 · 17:00–20:30' },
      { dias: 'Sábados', horas: '10:00–14:00' },
      { dias: 'Domingos y festivos', horas: 'Cerrado' },
    ],
  },

  valoracion: {
    media: 4.5,
    total: 155,
    fuente: 'ProvenExpert',
    /** PENDIENTE: enlace al perfil de ProvenExpert. */
    url: '',
  },

  /** PENDIENTE: redes sociales, si las tienen. Ej.: { nombre: 'Instagram', url: '…' } */
  redes: [] as { nombre: string; url: string }[],

  /**
   * Formulario de contacto. Con un ID de Formspree (https://formspree.io) el
   * formulario envía los mensajes por correo; vacío, abre el programa de correo
   * del visitante con el mensaje ya redactado (mailto).
   */
  formspreeId: '',
} as const;

export const telPrincipal = empresa.tienda.telefonos[0];

export const enlaceWhatsApp = `https://wa.me/${empresa.whatsapp.numero}?text=${encodeURIComponent(
  empresa.whatsapp.mensaje,
)}`;

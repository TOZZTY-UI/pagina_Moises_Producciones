export interface PageContent {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  body: string;
}

/**
 * Contenido editable de las páginas que se generan desde src/pages/[slug].astro.
 * El slug debe coincidir con uno publicado en navigation.ts.
 */
export const pageContent: PageContent[] = [
  {
    slug: 'sobre-mi',
    eyebrow: 'La persona detrás de cada experiencia',
    title: 'Sobre Mí',
    description: 'Dirección general y artística para experiencias musicales en vivo.',
    body: 'Creo propuestas musicales con una mirada cercana, elegante y cuidadosamente producida para que cada celebración tenga su propia identidad.',
  },
  {
    slug: 'galeria',
    eyebrow: 'Momentos que permanecen',
    title: 'Galería',
    description: 'Una selección de presentaciones, celebraciones y experiencias compartidas.',
    body: 'Próximamente encontrarás aquí una selección de fotografías y registros de nuestras producciones.',
  },
  {
    slug: 'servicios',
    eyebrow: 'Música pensada para tu ocasión',
    title: 'Servicios',
    description: 'Soluciones musicales y producción artística para eventos memorables.',
    body: 'Diseñamos el formato, repertorio y puesta en escena que mejor acompaña la energía de tu evento.',
  },
  {
    slug: 'repertorio',
    eyebrow: 'Una banda sonora a tu medida',
    title: 'Repertorio Musical',
    description: 'Un repertorio versátil para acompañar cada momento de tu celebración.',
    body: 'Cuéntanos el ambiente que buscas y construiremos una propuesta musical que conecte con tus invitados.',
  },
  {
    slug: 'contacto',
    eyebrow: 'Hablemos de tu próxima fecha',
    title: 'Contacto',
    description: 'Cuéntame qué estás imaginando y preparemos una experiencia a la altura.',
    body: 'Escríbeme para revisar disponibilidad, formatos y todos los detalles de tu evento.',
  },
  {
    slug: 'preguntas-frecuentes',
    eyebrow: 'Antes de comenzar',
    title: 'Preguntas Frecuentes',
    description: 'Respuestas rápidas sobre formatos, repertorio y producción.',
    body: 'Esta sección se actualizará con las preguntas más comunes de nuestros clientes.',
  },
  {
    slug: 'terminos-y-condiciones',
    eyebrow: 'Información importante',
    title: 'Términos y Condiciones',
    description: 'Condiciones generales para la contratación de nuestros servicios.',
    body: 'Esta sección se actualizará con la información contractual correspondiente.',
  },
];

export const getPageContent = (slug: string) =>
  pageContent.find((page) => page.slug === slug);

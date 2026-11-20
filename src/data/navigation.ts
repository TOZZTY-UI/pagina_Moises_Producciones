// Configuración de los enlaces de navegación del sitio.
// Desde aquí se generan los enlaces del menú lateral y del pie de página.
export interface NavigationLink {
  /** Identificador interno del enlace. */
  id: string;
  /** Segmento legible usado para generar la ruta dinámica. */
  slug: string;
  /** Texto visible para las personas usuarias. */
  label: string;
  /** Ruta de destino del enlace. */
  href: string;
  /** Nombre del icono que se mostrará. */
  icon: string;
  /** Indica si el enlace aparece en el menú lateral. */
  showInSidebar: boolean;
  /** Identificador de una sección dentro del landing, si corresponde. */
  sectionId?: string;
  /** Posición opcional dentro de los enlaces del pie de página. */
  footerOrder?: number;
}

export const navigation: NavigationLink[] = [
  { id: 'inicio', slug: '', label: 'Inicio', href: '/', icon: 'home', showInSidebar: true, sectionId: 'inicio' },
  { id: 'personas', slug: 'personas', label: 'Personas', href: '/#personas', icon: 'users', showInSidebar: true, sectionId: 'personas' },
];

export const sidebarLinks = navigation.filter((link) => link.showInSidebar);
// El pie de página solo incluye enlaces con una posición definida.
export const footerLinks = navigation
  .filter((link) => link.footerOrder !== undefined)
  .sort((a, b) => (a.footerOrder ?? 0) - (b.footerOrder ?? 0));

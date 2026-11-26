import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://producciones.saxeventos.cl',
  output: 'static',
  build: {
    redirects: true,
  },
  compressHTML: true,
  redirects: {
    '/saxeventos': '/personas/saxeventos',
    '/felipe-montupil': '/personas/felipe-montupil',
    '/dgviolinista': '/personas/dgviolinista',
    '/manudelrey': '/personas/manudelrey',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      minify: true,
      cssMinify: true,
      sourcemap: false,
    },
  },

  integrations: [
    sitemap({
      // la página 404 no son contenido indexable.
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
});

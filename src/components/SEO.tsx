import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  canonical?: string;
}

/**
 * Componente SEO para meta tags dinámicos por página
 * Mejora el posicionamiento en buscadores y redes sociales
 */
export const SEO = ({ 
  title = 'Egia K.O. Boxeo Elkartea',
  description = 'Club de boxeo profesional en Donostia-San Sebastián. Clases para todos los niveles con entrenadores titulados.',
  keywords = 'boxeo, Donostia, San Sebastián, gimnasio, entrenamiento, clases boxeo, club boxeo',
  image = '/images/hero-boxing.jpg',
  type = 'website',
  canonical
}: SEOProps) => {
  const fullTitle = title === 'Egia K.O. Boxeo Elkartea' 
    ? title 
    : `${title} | Egia K.O. Boxeo Elkartea`;

  const siteUrl = 'https://egiakoboxeo.com';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullCanonical = canonical || (typeof window !== 'undefined' ? `${siteUrl}${window.location.pathname}` : siteUrl);

  return (
    <Helmet>
      {/* Meta tags básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:site_name" content="Egia K.O. Boxeo Elkartea" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Metadatos adicionales */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Egia K.O. Boxeo Elkartea" />
      <meta name="language" content="Spanish" />
    </Helmet>
  );
};

export default SEO;

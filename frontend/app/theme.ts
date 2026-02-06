// Theme configuration loader for The Mind Department
import clientConfig from '../../client.config.json'

export const theme = {
  colors: {
    background: clientConfig.branding.colors.background,
    backgroundAlt: clientConfig.branding.colors.backgroundAlt,
    text: clientConfig.branding.colors.text,
    primary: clientConfig.branding.colors.primary,
    secondary: clientConfig.branding.colors.secondary,
    accent: clientConfig.branding.colors.accent,
  },
  typography: {
    fontFamily: clientConfig.branding.typography.fontFamily,
    fontUrl: clientConfig.branding.typography.fontUrl,
  },
  client: {
    name: clientConfig.client.name,
    slug: clientConfig.client.slug,
  }
}

export default theme

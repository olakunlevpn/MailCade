/**
 * Application Configuration
 * Centralized config that reads from environment variables and package.json
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Read package.json to get app info
let packageJson: any = {}
try {
  const packagePath = join(__dirname, '../package.json')
  packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
} catch (err) {
  console.error('Failed to read package.json:', err)
}

/**
 * Application configuration
 * Falls back to package.json values if env vars not set
 */
export const appConfig = {
  // App name from env or package.json
  name: process.env.VITE_APP_NAME || packageJson.productName || 'MailCade',
  
  // Version from package.json
  version: packageJson.version || '0.0.0',
  
  // Author information
  author: {
    name: process.env.VITE_AUTHOR_NAME || 'MailCade Team',
    link: process.env.VITE_AUTHOR_LINK || 'https://maylancer.org',
  },
  
  // External links
  links: {
    website: process.env.VITE_WEBSITE_LINK || 'https://maylancer.org/mailcade',
    docs: process.env.VITE_DOCS_LINK || 'https://maylancer.org/mailcade/docs',
    github: process.env.VITE_GITHUB_REPO || 'https://github.com/olakunlevpn/MailCade',
  },
  
  // App metadata
  description: packageJson.description || 'Developer Mail Sandbox',
  appId: 'com.mailcade.app',
}

/**
 * Automated Mailpit Binary Downloader
 * Downloads the latest Mailpit binaries for all platforms
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BINARIES_DIR = path.join(__dirname, '../electron/binaries')

// Mailpit version to download (use 'latest' or specific version like 'v1.10.0')
const MAILPIT_VERSION = 'latest'
const GITHUB_API = 'https://api.github.com/repos/axllent/mailpit/releases/latest'

// Binary configurations for each platform
const BINARIES = [
  {
    platform: 'darwin-arm64',
    filename: 'mailpit-darwin-arm64',
    assetPattern: /mailpit-darwin-arm64\.tar\.gz$/,
    executable: true,
  },
  {
    platform: 'darwin-x64',
    filename: 'mailpit-darwin-amd64',
    outputName: 'mailpit-darwin-x64',
    assetPattern: /mailpit-darwin-amd64\.tar\.gz$/,
    executable: true,
  },
  {
    platform: 'linux',
    filename: 'mailpit-linux-amd64',
    outputName: 'mailpit-linux',
    assetPattern: /mailpit-linux-amd64\.tar\.gz$/,
    executable: true,
  },
  {
    platform: 'win32',
    filename: 'mailpit-windows-amd64.exe',
    outputName: 'mailpit-win.exe',
    assetPattern: /mailpit-windows-amd64\.zip$/,
    executable: false,
  },
]

/**
 * Fetch JSON from URL
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'MailCade' }
    
    // Use GitHub token if available (for CI/CD to avoid rate limits)
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
    }
    
    https.get(url, { headers }, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    }).on('error', reject)
  })
}

/**
 * Download file from URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath)
    
    https.get(url, { headers: { 'User-Agent': 'MailCade' } }, (res) => {
      // Handle redirects
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        fs.unlinkSync(outputPath)
        return downloadFile(res.headers.location, outputPath).then(resolve).catch(reject)
      }
      
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(outputPath)
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      
      const totalSize = parseInt(res.headers['content-length'], 10)
      let downloadedSize = 0
      
      res.on('data', (chunk) => {
        downloadedSize += chunk.length
        const percent = ((downloadedSize / totalSize) * 100).toFixed(1)
        process.stdout.write(`\r  Downloading: ${percent}%`)
      })
      
      res.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log(' ✓')
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      fs.unlinkSync(outputPath)
      reject(err)
    })
  })
}

/**
 * Extract tar.gz file (simple extraction for single file)
 */
async function extractTarGz(archivePath, targetDir) {
  const tar = await import('tar')
  
  await tar.extract({
    file: archivePath,
    cwd: targetDir,
  })
}

/**
 * Extract zip file
 */
async function extractZip(archivePath, outputPath) {
  const AdmZip = (await import('adm-zip')).default
  
  const zip = new AdmZip(archivePath)
  const zipEntries = zip.getEntries()
  
  // Find the mailpit executable
  const exeEntry = zipEntries.find(entry => entry.entryName.includes('mailpit'))
  
  if (exeEntry) {
    const buffer = exeEntry.getData()
    fs.writeFileSync(outputPath, buffer)
  } else {
    throw new Error('Mailpit executable not found in zip')
  }
}

/**
 * Make file executable (Unix-like systems)
 */
function makeExecutable(filePath) {
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o755)
  }
}

/**
 * Main download process
 */
async function downloadMailpitBinaries() {
  console.log('📦 MailCade - Downloading Mailpit binaries...\n')
  
  // Create binaries directory if it doesn't exist
  if (!fs.existsSync(BINARIES_DIR)) {
    fs.mkdirSync(BINARIES_DIR, { recursive: true })
  }
  
  try {
    // Fetch latest release info
    console.log('🔍 Fetching latest Mailpit release...')
    const release = await fetchJSON(GITHUB_API)
    const version = release.tag_name
    console.log(`✓ Found version: ${version}\n`)
    
    // Download each binary
    for (const binary of BINARIES) {
      const outputName = binary.outputName || binary.filename
      const outputPath = path.join(BINARIES_DIR, outputName)
      
      // Check if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`✓ ${outputName} already exists, skipping...`)
        continue
      }
      
      console.log(`📥 Downloading ${outputName}...`)
      
      // Find matching asset
      const asset = release.assets.find(a => binary.assetPattern.test(a.name))
      
      if (!asset) {
        console.warn(`⚠️  Asset not found for ${binary.platform}, skipping...`)
        continue
      }
      
      const tempPath = path.join(BINARIES_DIR, `${outputName}.tmp`)
      
      try {
        // Download archive
        await downloadFile(asset.browser_download_url, tempPath)
        
        // Extract based on file type
        if (asset.name.endsWith('.tar.gz')) {
          console.log('  Extracting tar.gz...')
          await extractTarGz(tempPath, BINARIES_DIR)
          
          // The extracted file is usually named 'mailpit'
          const extractedPath = path.join(BINARIES_DIR, 'mailpit')
          if (fs.existsSync(extractedPath)) {
            fs.renameSync(extractedPath, outputPath)
          } else {
            throw new Error('Extracted binary not found')
          }
        } else if (asset.name.endsWith('.zip')) {
          console.log('  Extracting zip...')
          await extractZip(tempPath, outputPath)
        }
        
        // Make executable on Unix-like systems
        if (binary.executable) {
          makeExecutable(outputPath)
        }
        
        // Clean up temp file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath)
        }
        
        console.log(`  ✓ ${outputName} ready\n`)
      } catch (err) {
        console.error(`  ✗ Failed to process ${outputName}:`, err.message)
        // Clean up on error
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      }
    }
    
    console.log('\n✅ All binaries downloaded successfully!')
    console.log(`📁 Location: ${BINARIES_DIR}\n`)
    
    // List downloaded files
    const files = fs.readdirSync(BINARIES_DIR).filter(f => !f.endsWith('.md'))
    if (files.length > 0) {
      console.log('Downloaded files:')
      files.forEach(file => {
        const stats = fs.statSync(path.join(BINARIES_DIR, file))
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
        console.log(`  - ${file} (${sizeMB} MB)`)
      })
    }
    
  } catch (error) {
    console.error('\n❌ Error downloading binaries:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadMailpitBinaries()
}

export { downloadMailpitBinaries }

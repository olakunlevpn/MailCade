export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  smtpPort: number
  webUIPort: number
  autoStart: boolean
  emailRetention: number
  storageLocation: string
  notifications: boolean
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  smtpPort: 1025,
  webUIPort: 8025,
  autoStart: true,
  emailRetention: 500,
  storageLocation: '',
  notifications: true,
}

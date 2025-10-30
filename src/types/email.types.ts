export interface Email {
  ID: string
  MessageID: string
  From: EmailAddress
  To: EmailAddress[]
  Cc?: EmailAddress[]
  Bcc?: EmailAddress[]
  Subject: string
  Date: string
  Text: string
  HTML: string
  Size: number
  Attachments?: Attachment[]
  Tags?: string[]
  Read?: boolean
  Starred?: boolean
}

export interface EmailAddress {
  Name: string
  Address: string
}

export interface Attachment {
  PartID: string
  FileName: string
  ContentType: string
  Size: number
}

export interface EmailListQuery {
  limit?: number
  start?: number
  search?: string
  sort?: 'asc' | 'desc'
}

export interface EmailsResponse {
  total: number
  messages: Email[]
  unread: number
  count: number
  start: number
  tags: string[]
}

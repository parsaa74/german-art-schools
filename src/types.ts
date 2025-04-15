export interface University {
  id: string
  name: string
  latitude: number
  longitude: number
  websiteUrl: string
  state: string
  founded: string // Assuming founded is always a string year
  type: string // Consider using a union type like 'art_academy' | 'university' | 'design_school' etc. for better type safety
  programTypes: string[]
} 
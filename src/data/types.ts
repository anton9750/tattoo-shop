export interface Design {
  id: string
  artistId: string
  title: string
  style: string
  image: string
  width: number
  height: number
}

export interface Artist {
  id: string
  name: string
  studio: string
  city: string
  styles: string[]
  bio: string
  avatar: string
  instagram: string
  bookingLeadTime: string
  depositDkk: number
  rating: number
  reviewCount: number
}

export type BookingStatus = 'ny' | 'bekræftet' | 'afvist'

export interface BookingRequest {
  id: string
  artistId: string
  designId?: string | null
  name: string
  email: string
  phone: string
  placement: string
  size: string
  preferredDates: string
  message: string
  status: BookingStatus
  createdAt: string
}

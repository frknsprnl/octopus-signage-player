export type MediaType = 'image' | 'video';

export interface PlaylistItem {
  type: MediaType;
  url: string;
  duration?: number; // saniye — yalnızca görseller için
}


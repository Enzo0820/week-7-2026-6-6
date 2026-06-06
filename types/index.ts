export interface Movie {
  id: string;
  title: string;
  director: string;
  genre: string;
  year: number;
  rating: number; // 1-5 星
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export type SortKey = 'createdAt' | 'year' | 'rating';
export type SortOrder = 'asc' | 'desc';

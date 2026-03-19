export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
}

export interface Challenge {
  id: string;
  name: string;
  nameRo: string;
  description: string;
  descriptionRo: string;
  type: string;
  duration: number;
  target: number;
  participants: number;
  startDate: string;
  endDate: string;
  imageUrl?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  label: string;
}

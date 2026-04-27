export type Category = "food" | "medical" | "education" | "disaster";
export type NeedStatus = "open" | "assigned" | "completed";

export interface Need {
  _id: string;
  title: string;
  description: string;
  category: Category;
  urgency: 1 | 2 | 3 | 4 | 5;
  peopleAffected: number;
  priorityScore: number;
  status: NeedStatus;
  location: { lat: number; lng: number };
  createdAt: string;
}

export interface Volunteer {
  _id: string;
  userId: { name: string; email: string };
  skills: Category[];
  availability: boolean;
  location: { lat: number; lng: number };
  completedCount: number;
  avatar?: string;
}

export interface Assignment {
  _id: string;
  needId: string;
  needTitle: string;
  volunteerId: string;
  volunteerName: string;
  score: number;
  assignedAt: string;
  status: "active" | "completed";
}

export interface Match {
  volunteerId: string;
  volunteerName: string;
  score: number;
  distance: number;
  scoreBreakdown: { skillScore: number; distanceScore: number; availabilityScore: number };
  reasons: { skillMatch: boolean; distanceLabel: string; available: boolean };
}

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
  assignedVolunteerId?: { _id: string; name: string };
  completedAt?: string;
  createdAt: string;
}

export interface Volunteer {
  _id: string;
  name: string;
  email: string;
  profile: {
    skills: Category[];
    availability: boolean;
    location: { lat: number; lng: number };
    completedCount: number;
  };
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
  matchExplanation: string[];
}

export type Gender = 'male' | 'female' | 'any';
export type Schedule = 'early_bird' | 'night_owl' | 'flexible';
export type Lifestyle = 'quiet' | 'active' | 'mixed';
export type Cleanliness = 'neat' | 'average' | 'relaxed';
export type Duration = 'short' | 'long' | 'flexible';
export type YesNo = 'ok' | 'no';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface RoommateUser {
  id?: string;
  _id?: string;
  name: string;
  avatar?: string | null;
  gender?: string;
  phone?: string | null;
  email?: string | null;
}

export interface RoommateProfile {
  id: string;
  user: RoommateUser | string;
  budget: { min: number; max: number };
  gender: Gender;
  schedule: Schedule;
  lifestyle: Lifestyle;
  cleanliness: Cleanliness;
  duration: Duration;
  pets: YesNo;
  smoking: YesNo;
  looking: boolean;
  bio?: string | null;
  city?: string | null;
}

export interface RoommateMatch extends RoommateProfile {
  matchScore: number;
  requestStatus: RequestStatus | null;
}

export interface RoommateRequest {
  id: string;
  sender: RoommateUser | string;
  receiver: RoommateUser | string;
  status: RequestStatus;
  message?: string | null;
  createdAt: string;
}

export interface UpsertProfileInput {
  budget: { min: number; max: number };
  gender: Gender;
  schedule: Schedule;
  lifestyle: Lifestyle;
  cleanliness: Cleanliness;
  duration?: Duration;
  pets: YesNo;
  smoking: YesNo;
  looking?: boolean;
  bio?: string;
  city?: string;
}

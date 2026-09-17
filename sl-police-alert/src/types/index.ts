export type AlertPriority = 'High' | 'Medium' | 'Low';
export type PenaltyStatus = 'Not paid' | 'Paid';

export interface Message {
  id: string;
  image: string;
  title: string;
  content: string;
  date: string;
  time: string;
  priority: AlertPriority;
  status: string;
  sentBy: string;
  departments: { departmentId: string; status: string }[];
}

export interface Penalty {
  id: string;
  code: string;
  violation: string;
  fee: string;
  vehicle: string;
  nic: string;
  email: string;
  location: string;
  date: string;
  status: PenaltyStatus;
  issuedBy: string;
  createdAt: string;
}

export type CreatePenaltyInput = Omit<Penalty, 'id' | 'createdAt' | 'date'> & {
  date?: string;
};

export interface EmergencyContact {
  id: string;
  name: string;
  title: string;
  contact: string;
  description: string;
}

export interface HiruNews {
  id: string;
  title: string;
  story: string;
  date: string;
  image: string;
  url: string;
}

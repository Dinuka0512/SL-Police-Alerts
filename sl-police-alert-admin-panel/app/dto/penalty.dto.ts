export interface PenaltyDTO {
  p_id: string;
  code?: string;
  violation: string;
  fee: string;
  vehicle?: string;
  nic?: string;
  location?: string;
  date?: string;
  status?: string;
  issuedBy?: string;
  createdAt?: string;
}

export interface CreatePenaltyDTO {
  code: string;
  violation: string;
  fee: string;
  vehicle: string;
  nic: string;
  location: string;
  date: string;
  status: string;
  issuedBy: string;
}

export type UpdatePenaltyDTO = Partial<CreatePenaltyDTO>;
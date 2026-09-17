import { http } from '@/lib/api';
import { getAuthState } from '@/store/auth';

import type { CreatePenaltyInput, Penalty, PenaltyStatus } from '@/types';

type PenaltyDTO = {
  p_id: string;
  code?: string;
  violation: string;
  fee: string;
  vehicle?: string;
  nic?: string;
  email?: string;
  location?: string;
  date?: string;
  status?: string;
  issuedBy?: string;
  createdAt?: string;
};

function toPenalty(dto: PenaltyDTO): Penalty {
  return {
    id: String(dto.p_id),
    code: dto.code ?? '',
    violation: dto.violation,
    fee: dto.fee,
    vehicle: dto.vehicle ?? '',
    nic: dto.nic ?? '',
    email: dto.email ?? '',
    location: dto.location ?? '',
    date: dto.date ?? '',
    status: (dto.status === 'Paid' ? 'Paid' : 'Not paid') as PenaltyStatus,
    issuedBy: dto.issuedBy ?? '',
    createdAt: dto.createdAt ?? '',
  };
}

export class PenaltyService {
  async findAll(): Promise<Penalty[]> {
    const dtos = await http.get<PenaltyDTO[]>('/api/penalties');
    const name = getAuthState().user?.name ?? '';
    const mine = dtos.filter(dto => {
      if (!name || !dto.issuedBy) return false;
      return dto.issuedBy === name;
    });
    return mine.map(toPenalty);
  }

  async create(input: CreatePenaltyInput): Promise<Penalty> {
    const dto = await http.post<PenaltyDTO>('/api/penalties', input);
    return toPenalty(dto);
  }
}

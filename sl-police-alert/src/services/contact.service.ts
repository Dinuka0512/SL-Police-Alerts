import { http } from '@/lib/api';

import type { EmergencyContact } from '@/types';

type EmergencyContactDTO = {
  emgCon_id: string;
  name: string;
  title: string;
  contact: string;
  description: string;
};

function toContact(dto: EmergencyContactDTO): EmergencyContact {
  return {
    id: String(dto.emgCon_id),
    name: dto.name,
    title: dto.title ?? '',
    contact: dto.contact,
    description: dto.description ?? '',
  };
}

export class ContactService {
  async findAll(): Promise<EmergencyContact[]> {
    const dtos = await http.get<EmergencyContactDTO[]>('/api/emergancyContacts');
    return dtos.map(toContact);
  }
}

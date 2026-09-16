import { http } from '@/lib/api';

import type { AlertPriority, Message } from '@/types';

type MessageDTO = {
  m_id: string;
  image?: string;
  title: string;
  content: string;
  date?: string;
  time?: string;
  priority?: string;
  status?: string;
  sentBy?: string;
  departments?: { departmentId: string; status: string }[];
};

const PRIORITIES: AlertPriority[] = ['High', 'Medium', 'Low'];

function toMessage(dto: MessageDTO): Message {
  const priority = dto.priority ?? 'Medium';
  return {
    id: String(dto.m_id),
    image: dto.image ?? '',
    title: dto.title,
    content: dto.content,
    date: dto.date ?? '',
    time: dto.time ?? '',
    priority: (PRIORITIES.includes(priority as AlertPriority)
      ? priority
      : 'Medium') as AlertPriority,
    status: dto.status ?? 'Sent',
    sentBy: dto.sentBy ?? '',
    departments: dto.departments ?? [],
  };
}

export class MessageService {
  async findAll(): Promise<Message[]> {
    const dtos = await http.get<MessageDTO[]>('/api/messages');
    return dtos.map(toMessage);
  }

  async findById(id: string): Promise<Message> {
    const dto = await http.get<MessageDTO>(`/api/messages/${id}`);
    return toMessage(dto);
  }
}

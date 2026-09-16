export interface DeptDeliveryDTO {
  departmentId: string;
  status: string;
}

export interface MessageDTO {
  m_id: string;
  image?: string;
  title: string;
  content: string;
  date?: string;
  time?: string;
  priority?: string;
  status?: string;
  sentBy?: string;
  departments?: DeptDeliveryDTO[];
}

export interface CreateMessageDTO {
  title: string;
  content: string;
  image: string;
  date: string;
  time: string;
  priority: string;
  status: string;
  sentBy: string;
  departments: DeptDeliveryDTO[];
}

export type UpdateMessageDTO = Partial<CreateMessageDTO>;
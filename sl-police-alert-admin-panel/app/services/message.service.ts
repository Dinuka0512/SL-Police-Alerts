import { HttpClient } from "~/lib/http";

import type { MessageDTO, CreateMessageDTO, UpdateMessageDTO } from "~/dto";

export class MessageService {
  constructor(private readonly http: HttpClient) {}

  findAll(): Promise<MessageDTO[]> {
    return this.http.get<MessageDTO[]>("/api/messages");
  }

  findById(id: string): Promise<MessageDTO> {
    return this.http.get<MessageDTO>(`/api/messages/${id}`);
  }

  create(input: CreateMessageDTO): Promise<MessageDTO> {
    return this.http.post<MessageDTO>("/api/messages", input);
  }

  update(id: string, input: UpdateMessageDTO): Promise<MessageDTO> {
    return this.http.put<MessageDTO>(`/api/messages/${id}`, input);
  }

  remove(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/messages/${id}`);
  }
}
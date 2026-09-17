import { HttpClient } from "~/lib/http";

import type { PenaltyDTO, CreatePenaltyDTO, UpdatePenaltyDTO } from "~/dto";

export class PenaltyService {
  constructor(private readonly http: HttpClient) {}

  findAll(): Promise<PenaltyDTO[]> {
    return this.http.get<PenaltyDTO[]>("/api/penalties");
  }

  search(q: string): Promise<PenaltyDTO[]> {
    return this.http.get<PenaltyDTO[]>("/api/penalties/search", { q });
  }

  findById(id: string): Promise<PenaltyDTO> {
    return this.http.get<PenaltyDTO>(`/api/penalties/${id}`);
  }

  create(input: CreatePenaltyDTO): Promise<PenaltyDTO> {
    return this.http.post<PenaltyDTO>("/api/penalties", input);
  }

  update(id: string, input: UpdatePenaltyDTO): Promise<PenaltyDTO> {
    return this.http.put<PenaltyDTO>(`/api/penalties/${id}`, input);
  }

  remove(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/penalties/${id}`);
  }
}
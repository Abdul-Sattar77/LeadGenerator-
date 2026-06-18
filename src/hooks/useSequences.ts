"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SequenceRow {
  id: string;
  name: string;
  status: string;
  stepCount: number;
  enrolledCount: number;
  activeCount: number;
  createdAt: string;
}

export function useSequences() {
  return useQuery({ queryKey: ["sequences"], queryFn: () => api<SequenceRow[]>("/api/app/sequences") });
}

export function useSequence(id: string) {
  return useQuery({ queryKey: ["sequence", id], queryFn: () => api<any>(`/api/app/sequences/${id}`), enabled: Boolean(id) });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api<{ id: string }>("/api/app/sequences", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sequences"] }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { CreateDealInput, UpdateDealInput } from "@/lib/validations/deal";

export interface Stage {
  id: string;
  name: string;
  kind: string;
  probability: number;
  color: string;
}
export interface DealCard {
  id: string;
  name: string;
  value: number;
  stageId: string;
  status: string;
  company: { id: string; name: string } | null;
  primaryContact: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
  idleDays: number;
  rotting: boolean;
}
export interface Board {
  pipeline: { id: string; name: string; stages: Stage[] };
  deals: DealCard[];
  stats: {
    total: number; openCount: number; openValue: number; weightedPipeline: number;
    wonCount: number; wonValue: number; winRate: number; avgWonValue: number; rottingCount: number;
  };
}

export interface PipelineSummary {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}

export function usePipelines() {
  return useQuery({ queryKey: ["pipelines"], queryFn: () => api<PipelineSummary[]>(`/api/app/pipelines`) });
}

export function useBoard(pipelineId?: string) {
  return useQuery({
    queryKey: qk.deals({ pipelineId }),
    queryFn: () => api<Board>(`/api/app/deals${qs({ pipelineId })}`),
  });
}

export function useDeal(id: string) {
  return useQuery({ queryKey: qk.deal(id), queryFn: () => api<any>(`/api/app/deals/${id}`), enabled: Boolean(id) });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateDealInput> & { name: string; pipelineId: string }) =>
      api(`/api/app/deals`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useUpdateDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<UpdateDealInput>) =>
      api(`/api/app/deals/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.deal(id) });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

/** Move a deal to a new stage (used by drag-and-drop). */
export function useMoveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      api(`/api/app/deals/${id}`, { method: "PATCH", body: JSON.stringify({ stageId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useAddDealNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api(`/api/app/deals/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.deal(id) }),
  });
}

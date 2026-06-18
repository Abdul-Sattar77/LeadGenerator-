"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/lib/validations/company";

export interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  owner: { id: string; name: string } | null;
  tags: { id: string; name: string; color: string }[];
  contactCount: number;
  dealCount: number;
  openValue: number;
  createdAt: string;
}

interface CompanyListParams {
  q?: string;
  page?: number;
  tagId?: string;
}

export function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: qk.companies(params),
    queryFn: () =>
      api<{ companies: CompanyRow[]; total: number; page: number; pageSize: number }>(
        `/api/app/companies${qs({ q: params.q, page: params.page, tagId: params.tagId })}`
      ),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: qk.company(id),
    queryFn: () => api<any>(`/api/app/companies/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateCompanyInput> & { name: string }) =>
      api(`/api/app/companies`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyInput) =>
      api(`/api/app/companies/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.company(id) });
      qc.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/app/companies/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useAddCompanyNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api(`/api/app/companies/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.company(id) }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { CreateContactInput, UpdateContactInput } from "@/lib/validations/contact";

export interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  lifecycleStage: string;
  leadScore: number;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
  tags: { id: string; name: string; color: string }[];
  dealCount: number;
  createdAt: string;
}

interface ContactListParams {
  q?: string;
  page?: number;
  companyId?: string;
  lifecycleStage?: string;
  tagId?: string;
}

export function useContacts(params: ContactListParams) {
  return useQuery({
    queryKey: qk.contacts(params),
    queryFn: () =>
      api<{ contacts: ContactRow[]; total: number; page: number; pageSize: number }>(
        `/api/app/contacts${qs({ ...params })}`
      ),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: qk.contact(id),
    queryFn: () => api<any>(`/api/app/contacts/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateContactInput> & { firstName: string }) =>
      api(`/api/app/contacts`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateContactInput) =>
      api(`/api/app/contacts/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contact(id) });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/app/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useAddContactNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api(`/api/app/contacts/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contact(id) }),
  });
}

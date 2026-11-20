import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiCall, generateUuid } from './client'
import { useFeedback } from '../components/ui/FeedbackProvider'

export function useReferenceData(tahun) {
  return useQuery({
    queryKey: ['bootstrap', Number(tahun)],
    queryFn: ({ signal }) => apiCall('bootstrap', { tahun: Number(tahun) }, { signal }),
    retry: false,
  })
}

export function optimisticReference(data, payload, action) {
  if (!data) return data
  if (action === 'profile.update') return { ...data, profile: payload.profile }
  const key = action.startsWith('skp.year.')
    ? 'years'
    : action.startsWith('skp.item.')
      ? 'items'
      : action.startsWith('skp.template.')
        ? 'templates'
        : 'holidays'
  const rows = data[key] || []
  const deleting = action.endsWith('.delete')
  const restoring = action.endsWith('.restore')
  let records
  if (action === 'holiday.import') {
    records = [...rows]
    for (const row of payload.rows)
      if (
        typeof row?.tanggal === 'string' &&
        row.tanggal.startsWith(String(data.tahun)) &&
        !records.some((existing) => existing.tanggal === row.tanggal)
      )
        records.push({ ...row, id: generateUuid(), optimistic: true })
  } else if (deleting) records = rows.filter((row) => row.id !== payload.id)
  else {
    const updated = {
      ...payload,
      id: payload.id || generateUuid(),
      created_at: payload.created_at || new Date().toISOString(),
      deleted: 0,
      optimistic: true,
    }
    records = rows.some((row) => row.id === updated.id)
      ? rows.map((row) => (row.id === updated.id ? updated : row))
      : [...rows, updated]
    if (key === 'holidays')
      records = records.filter((row) => row.tanggal.startsWith(String(data.tahun)))
  }
  const next = { ...data, [key]: records }
  if (key === 'items' && deleting)
    next.templates = (data.templates || []).filter((row) => row.skp_item_id !== payload.id)
  if (key === 'items' && restoring)
    next.templates = [
      ...(data.templates || []),
      ...(payload.related || []).map((row) => ({ ...row, deleted: 0, optimistic: true })),
    ]
  return next
}

export function useReferenceMutation(action, { onSaved, undo, quiet = false } = {}) {
  const client = useQueryClient()
  const notify = useFeedback()
  const mutation = useMutation({
    mutationFn: (payload) => apiCall(action, payload),
    onMutate: async (payload) => {
      await client.cancelQueries({ queryKey: ['bootstrap'] })
      const snapshots = client.getQueriesData({ queryKey: ['bootstrap'] })
      client.setQueriesData({ queryKey: ['bootstrap'] }, (data) =>
        optimisticReference(data, payload, action),
      )
      return { snapshots }
    },
    onError: (error, payload, context) => {
      for (const [key, data] of context?.snapshots || []) client.setQueryData(key, data)
      notify({
        text: error.message,
        error: true,
        conflict: error.code === 'CONFLICT',
        retry:
          error.code === 'CONFLICT'
            ? () => window.location.reload()
            : () => mutation.mutate(payload),
      })
    },
    onSuccess: (data, payload) => {
      if (action === 'profile.update') {
        client.setQueryData(['auth', 'me'], (old) =>
          old ? { ...old, profile: data.profile } : old,
        )
      }
      onSaved?.(data, payload)
      if (!quiet)
        notify({
          text: action.endsWith('.delete')
            ? 'Data dihapus sementara.'
            : action === 'holiday.import'
              ? `${data.added} hari libur ditambahkan; ${data.skipped} baris dilewati.`
              : 'Perubahan tersimpan.',
          undo: undo ? () => undo(data) : undefined,
        })
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['bootstrap'] }),
        client.invalidateQueries({ queryKey: ['activities'] }),
      ]),
  })
  return mutation
}

export const useTemplatePreview = () =>
  useMutation({ mutationFn: (payload) => apiCall('skp.template.preview', payload) })

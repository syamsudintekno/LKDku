import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiCall, generateUuid } from './client'
import { useFeedback } from '../components/ui/FeedbackProvider'

export const useActivityMonth = (month, enabled = true) =>
  useQuery({
    queryKey: ['activities', month],
    enabled,
    queryFn: ({ signal }) => apiCall('activity.list', { month }, { signal }),
    retry: false,
  })
export const useDraftPreview = () =>
  useMutation({ mutationFn: (month) => apiCall('plan.generate', { month, dryRun: true }) })

export function applyActivityChange(data, action, payload, response) {
  if (!data) return data
  let rows = [...data.records]
  let changes = []
  if (response) {
    const keys = new Set((payload._preview || []).map((row) => row.generated_key))
    rows = rows.filter((row) => !(row.optimistic && keys.has(row.generated_key)))
    changes = response.records || (response.record ? [response.record] : [])
  } else if (action === 'plan.generate')
    changes = (payload._preview || []).map((row) => ({
      ...row,
      id: `preview:${row.generated_key}`,
      optimistic: true,
    }))
  else if (action === 'activity.bulkStatus')
    changes = rows
      .filter((row) => payload.changes.some((change) => change.id === row.id))
      .map((row) => ({ ...row, status: payload.status, optimistic: true }))
  else
    changes = [
      {
        ...payload,
        created_at: payload.created_at || new Date().toISOString(),
        deleted: action === 'activity.delete' ? 1 : 0,
        optimistic: true,
      },
    ]
  for (const change of changes) {
    rows = rows.filter(
      (row) =>
        row.id !== change.id &&
        !(change.generated_key && row.generated_key === change.generated_key),
    )
    if (change.deleted != 1 && change.tanggal?.slice(0, 7) === data.month)
      rows.push(response ? { ...change, optimistic: false } : change)
  }
  return { ...data, records: rows }
}

export function useActivityMutation(action, { onSaved, undo, quiet = false } = {}) {
  const client = useQueryClient()
  const notify = useFeedback()
  const mutation = useMutation({
    mutationFn: ({ _preview, ...payload }) => apiCall(action, payload),
    onMutate: async (payload) => {
      await client.cancelQueries({ queryKey: ['activities'] })
      const snapshots = client.getQueriesData({ queryKey: ['activities'] })
      client.setQueriesData({ queryKey: ['activities'] }, (data) =>
        applyActivityChange(data, action, payload),
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
    onSuccess: (response, payload) => {
      client.setQueriesData({ queryKey: ['activities'] }, (data) =>
        applyActivityChange(data, action, payload, response),
      )
      onSaved?.(response, payload)
      if (!quiet)
        notify({
          text:
            action === 'plan.generate'
              ? `${response.created} kegiatan rencana ditambahkan; ${response.skipped} kunci sudah ada.`
              : action === 'activity.delete'
                ? 'Kegiatan dihapus sementara.'
                : response.conflicts?.length
                  ? 'Kegiatan tersimpan. Ada bentrok jam yang perlu diperiksa.'
                  : 'Perubahan kegiatan tersimpan.',
          undo: undo ? () => undo(response) : undefined,
        })
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['activities'] }),
        client.invalidateQueries({ queryKey: ['report'] }),
        client.invalidateQueries({ queryKey: ['reports'] }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  })
  const prepare = (payload) =>
    action === 'activity.upsert' && !payload.id
      ? { ...payload, id: generateUuid(), create: true }
      : payload
  return {
    ...mutation,
    mutate: (payload, options) => mutation.mutate(prepare(payload), options),
    mutateAsync: (payload, options) => mutation.mutateAsync(prepare(payload), options),
  }
}

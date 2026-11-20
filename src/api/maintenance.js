import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCall, clearToken } from './client'
import { useFeedback } from '../components/ui/FeedbackProvider'
export const useDashboard = (month) =>
  useQuery({
    queryKey: ['dashboard', month],
    queryFn: ({ signal }) => apiCall('dashboard.summary', { month }, { signal }),
    retry: false,
  })
export const useConfigSettings = () =>
  useQuery({
    queryKey: ['config'],
    queryFn: ({ signal }) => apiCall('config.get', {}, { signal }),
    retry: false,
  })
export const useSessions = () =>
  useQuery({
    queryKey: ['sessions'],
    queryFn: ({ signal }) => apiCall('auth.sessions', {}, { signal }),
    retry: false,
  })
export function useMaintenanceAction(action, onSaved) {
  const client = useQueryClient(),
    notify = useFeedback()
  return useMutation({
    gcTime: 0,
    mutationFn: (payload) => apiCall(action, payload),
    onSuccess: async (result, payload) => {
      if (action === 'auth.changePassword') {
        clearToken()
        client.clear()
      } else if (!action.startsWith('backup.') || (action === 'backup.import' && !payload.dryRun))
        await client.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
      onSaved?.(result)
    },
    onError: (error) =>
      notify({ text: error.message, error: true, conflict: error.code === 'CONFLICT' }),
    onSettled: (_, __, payload) => {
      if (action === 'auth.changePassword' && payload)
        for (const key of ['currentPassword', 'newPassword', 'confirmation']) payload[key] = ''
    },
  })
}

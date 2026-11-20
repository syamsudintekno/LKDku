import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCall } from './client'
import { useFeedback } from '../components/ui/FeedbackProvider'

export const useReport = (month, tanggal_ttd) =>
  useQuery({
    queryKey: ['report', month, tanggal_ttd],
    queryFn: ({ signal }) => apiCall('report.preview', { month, tanggal_ttd }, { signal }),
    retry: false,
  })
export const useReportList = (tahun) =>
  useQuery({
    queryKey: ['reports', tahun],
    queryFn: ({ signal }) => apiCall('report.list', { tahun }, { signal }),
    retry: false,
  })
export function useReportMutation(action, onSaved) {
  const client = useQueryClient(),
    notify = useFeedback()
  return useMutation({
    mutationFn: (payload) => apiCall(action, payload),
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['report'] }),
        client.invalidateQueries({ queryKey: ['reports'] }),
        client.invalidateQueries({ queryKey: ['activities'] }),
      ])
      onSaved?.(result)
    },
    onError: (error) =>
      notify({ text: error.message, error: true, conflict: error.code === 'CONFLICT' }),
  })
}

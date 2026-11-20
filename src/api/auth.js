/**
 * auth.js - Hook React Query untuk Autentikasi
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { apiCall, setToken, clearToken, getToken, subscribeToken } from './client'

export const useSessionToken = () => useSyncExternalStore(subscribeToken, getToken, () => null)

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ username, password, remember }) => {
      const data = await apiCall('auth.login', { username, password, remember })
      setToken(data.token, remember)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries()
    },
    mutationFn: async () => {
      try {
        await apiCall('auth.logout')
      } finally {
        clearToken()
      }
    },
    onSettled: () => {
      queryClient.clear()
    },
  })
}

export function useMe() {
  const token = useSessionToken()
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async ({ signal }) => {
      return apiCall('auth.me', {}, { signal })
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

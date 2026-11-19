/**
 * auth.js - Hook React Query untuk Autentikasi
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiCall, setToken, clearToken, getToken } from './client'

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
    mutationFn: async () => {
      try {
        await apiCall('auth.logout')
      } finally {
        clearToken()
      }
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useMe() {
  const token = getToken()
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      return apiCall('auth.me')
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

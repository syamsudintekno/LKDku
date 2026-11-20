import React, { useState } from 'react'
import { CAlert, CForm, CFormInput } from '@coreui/react'
import { useSessions, useMaintenanceAction } from '../../api/maintenance'
import FunButton from '../../components/ui/FunButton'
import ReferenceState from '../../components/ui/ReferenceState'
import { APP_ICONS } from '../../components/ui/icons'
import { formatDateTimeId } from '../../domain/dateId'
const SecuritySettings = () => {
  const [draft, setDraft] = useState({ currentPassword: '', newPassword: '', confirmation: '' }),
    [visible, setVisible] = useState(false),
    [error, setError] = useState('')
  const sessions = useSessions(),
    password = useMaintenanceAction('auth.changePassword'),
    revoke = useMaintenanceAction('auth.revokeOthers')
  const busy = password.isPending || revoke.isPending
  return (
    <>
      <h2 className="h5">Keamanan akun</h2>
      <p>Penggantian password mengakhiri seluruh sesi. Anda akan diminta masuk kembali.</p>
      <CForm
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          if (draft.newPassword !== draft.confirmation) {
            setError('Konfirmasi password belum sama.')
            return
          }
          try {
            await password.mutateAsync({ ...draft })
          } catch (failure) {
            setError(failure.message)
          } finally {
            setDraft({ currentPassword: '', newPassword: '', confirmation: '' })
          }
        }}
      >
        {[
          ['currentPassword', 'Password saat ini', 'current-password'],
          ['newPassword', 'Password baru', 'new-password'],
          ['confirmation', 'Konfirmasi password baru', 'new-password'],
        ].map(([name, label, autoComplete]) => (
          <CFormInput
            key={name}
            id={`security-${name}`}
            label={label}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            required
            minLength={name === 'currentPassword' ? 1 : 12}
            maxLength={256}
            value={draft[name]}
            disabled={busy}
            onChange={(event) => setDraft({ ...draft, [name]: event.target.value })}
            className="mb-3"
          />
        ))}
        <FunButton
          type="button"
          variant="ghost"
          icon={APP_ICONS.lock}
          className="mb-3"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? 'Sembunyikan password' : 'Tampilkan password'}
        </FunButton>
        {error && (
          <CAlert color="danger" role="alert">
            {error}
          </CAlert>
        )}
        <div>
          <FunButton
            type="submit"
            icon={APP_ICONS.lock}
            loading={password.isPending}
            disabled={busy}
          >
            Ganti password dan keluar
          </FunButton>
        </div>
      </CForm>
      <hr />
      <h3 className="h6">Sesi aktif</h3>
      <ReferenceState query={sessions}>
        <ul>
          {sessions.data?.map((row) => (
            <li key={row.id}>
              {row.current ? 'Sesi ini' : 'Sesi lain'} · berakhir {formatDateTimeId(row.expires_at)}{' '}
              {row.remember ? '(ingat saya)' : ''}
            </li>
          ))}
        </ul>
      </ReferenceState>
      <FunButton
        variant="ghost"
        icon={APP_ICONS.logout}
        loading={revoke.isPending}
        disabled={busy || !sessions.data?.some((row) => !row.current)}
        onClick={() => revoke.mutate({})}
      >
        Keluar dari sesi lain
      </FunButton>
      {revoke.isSuccess && (
        <p role="status" className="mt-2">
          Sesi lain sudah diakhiri.
        </p>
      )}
    </>
  )
}
export default SecuritySettings

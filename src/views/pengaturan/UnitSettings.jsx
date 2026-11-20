import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CForm, CFormTextarea } from '@coreui/react'
import { useConfigSettings, useMaintenanceAction } from '../../api/maintenance'
import ReferenceState from '../../components/ui/ReferenceState'
import FunButton from '../../components/ui/FunButton'
import { APP_ICONS } from '../../components/ui/icons'
const Editor = ({ data }) => {
  const [text, setText] = useState(data.config.satuan_list.join('\n')),
    [version, setVersion] = useState(data.version)
  const save = useMaintenanceAction('config.update', (result) => {
    setText(result.config.satuan_list.join('\n'))
    setVersion(result.version)
  })
  return (
    <CForm
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate({
          version,
          satuan_list: text
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
        })
      }}
    >
      <h2 className="h5">Unsur dan satuan</h2>
      <p>Unsur baku: {data.config.unsur_list.join(', ')}.</p>
      <p>
        Satuan yang pernah dipakai pada SKP, template, atau kegiatan tetap dipertahankan agar data
        lama dapat dibaca.
      </p>
      <CFormTextarea
        id="unit-list"
        label="Satuan, satu per baris"
        rows={8}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          save.reset()
        }}
        disabled={save.isPending}
      />
      {save.error && (
        <CAlert color="danger" role="alert">
          {save.error.message}
        </CAlert>
      )}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <FunButton
          type="submit"
          icon={APP_ICONS.simpan}
          loading={save.isPending}
          success={save.isSuccess}
        >
          Simpan satuan
        </FunButton>
        <FunButton
          variant="ghost"
          disabled={save.isPending}
          onClick={() => {
            setText(data.config.satuan_list.join('\n'))
            setVersion(data.version)
            save.reset()
          }}
        >
          Muat ulang daftar
        </FunButton>
      </div>
    </CForm>
  )
}
Editor.propTypes = { data: PropTypes.object.isRequired }
const UnitSettings = () => {
  const query = useConfigSettings()
  return <ReferenceState query={query}>{query.data && <Editor data={query.data} />}</ReferenceState>
}
export default UnitSettings

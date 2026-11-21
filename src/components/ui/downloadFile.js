export function downloadText(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type })),
    anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

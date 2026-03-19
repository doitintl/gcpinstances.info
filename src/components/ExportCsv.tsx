import { Download } from 'lucide-react'

interface Props {
  filename: string
  headers: string[]
  getRows: () => (string | number | null)[][]
}

export function ExportCsv({ filename, headers, getRows }: Props) {
  const handleExport = () => {
    const rows = getRows()
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-blue-600 text-white bg-blue-600 hover:bg-blue-700 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export to CSV
    </button>
  )
}

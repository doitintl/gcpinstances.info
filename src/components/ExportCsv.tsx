import { Download } from 'lucide-react'
import type { Instance } from '../lib/types'

interface Props {
  instances: Instance[]
  region: string
}

export function ExportCsv({ instances, region }: Props) {
  const handleExport = () => {
    const headers = ['Machine type', 'Series', 'Family', 'vCPUs', 'Memory (GiB)', 'Linux SUD ($/hr)', 'Linux CUD 1yr ($/hr)', 'Windows SUD ($/hr)', 'Windows CUD 1yr ($/hr)']

    const rows = instances.map((inst) => {
      const p = inst.pricing[region] ?? {}
      return [
        inst.name,
        inst.series,
        inst.family,
        inst.vCpus,
        inst.memoryGb,
        p.linuxSud ?? '',
        p.linuxCud1yr ?? '',
        p.windowsSud ?? '',
        p.windowsCud1yr ?? '',
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gcp-instances-${region}.csv`
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

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { buildDoitUrl } from '../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  formattedDate: string
}

export function AboutDialog({ open, onClose, formattedDate }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">About GCP Instances</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto flex-1 px-6 py-5 space-y-4 text-sm text-gray-600">
          <p>
            This site is not maintained by or affiliated with Google. Data accuracy cannot be guaranteed.
            Pricing data is sourced from the{' '}
            <a href="https://cloud.google.com/billing/docs/reference/rest" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Google Cloud Billing Catalog API
            </a>.
          </p>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Why?</h3>
            <p>
              Comparing instance types on Google Cloud's own documentation is tedious and time-consuming.
              This tool puts all instance families, specs, and pricing in one place so you can filter and compare instantly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Who?</h3>
            <p>
              Originally inspired by{' '}
              <a href="https://instances.vantage.sh" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ec2instances.info
              </a>{' '}
              (created by @powdahound). Rewritten and maintained by{' '}
              <a href={buildDoitUrl('', 'brand', 'about-dialog')} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                DoiT International
              </a>.
              Contributions are welcome on{' '}
              <a href="https://github.com/doitintl/gcpinstances.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                GitHub
              </a>.
            </p>
          </div>
          {formattedDate && (
            <p className="text-gray-500">
              Pricing last updated: <span className="font-medium text-gray-700">{formattedDate}</span>
            </p>
          )}
          <p>
            Found an issue?{' '}
            <a href="https://github.com/doitintl/gcpinstances.info/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Report it on GitHub
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}

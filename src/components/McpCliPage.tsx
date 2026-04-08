import { Terminal, ArrowLeft, MonitorCheck, Bot, Workflow } from 'lucide-react'

export function McpCliPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-500/10 rounded-full p-4">
            <Terminal className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">MCP &amp; CLI Support</h1>
        <p className="text-blue-500 font-semibold text-lg mb-6">Coming Soon</p>

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          We're exploring building developer tools on top of this pricing data. Here's what we're thinking:
        </p>

        <ul className="text-left space-y-4 mb-10">
          <li className="flex items-start gap-3">
            <MonitorCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <span className="text-gray-700 dark:text-gray-200 text-sm">
              <strong>CLI tool</strong> — query GCP instance pricing directly from your terminal
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <span className="text-gray-700 dark:text-gray-200 text-sm">
              <strong>MCP server</strong> — integrate pricing data with AI assistants like Claude
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Workflow className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <span className="text-gray-700 dark:text-gray-200 text-sm">
              <strong>Automation</strong> — script and automate pricing lookups in CI/CD pipelines
            </span>
          </li>
        </ul>

        <a
          href="#home"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing table
        </a>
      </div>
    </div>
  )
}

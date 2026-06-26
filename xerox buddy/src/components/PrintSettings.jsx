import { motion } from 'framer-motion'

function OptionButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200
        ${active
          ? 'bg-purple-600 text-white glow-purple-sm'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
        }
      `}
    >
      {children}
    </button>
  )
}

export default function PrintSettings({ fileInfo, settings, onChange }) {
  const { colorMode, sideMode, copies } = settings

  const set = (key, val) => onChange({ ...settings, [key]: val })

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-4"
    >
      {/* File info card */}
      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{fileInfo.name}</p>
          <p className="text-gray-500 text-xs">{fileInfo.size}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-purple-400 font-bold text-lg">{fileInfo.totalPages}</p>
          <p className="text-gray-500 text-xs">pages</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Print Settings</h2>

      <div className="space-y-5">
        {/* Color Mode */}
        <div className="glass rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-3">Print Type</p>
          <div className="flex gap-3">
            <OptionButton active={colorMode === 'bw'} onClick={() => set('colorMode', 'bw')}>
              ⬛ Black & White — ₹2/page
            </OptionButton>
            <OptionButton active={colorMode === 'color'} onClick={() => set('colorMode', 'color')}>
              🎨 Color — ₹5/page
            </OptionButton>
          </div>
        </div>

        {/* Side Mode */}
        <div className="glass rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-3">Print Side</p>
          <div className="flex gap-3">
            <OptionButton active={sideMode === 'single'} onClick={() => set('sideMode', 'single')}>
              📄 Single Side
            </OptionButton>
            <OptionButton active={sideMode === 'double'} onClick={() => set('sideMode', 'double')}>
              📋 Double Side
            </OptionButton>
          </div>
          {sideMode === 'double' && (
            <p className="text-purple-400/70 text-xs mt-2">
              ✓ Double side halves your page count — saves cost!
            </p>
          )}
        </div>

        {/* Copies */}
        <div className="glass rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-3">Number of Copies</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => set('copies', Math.max(1, copies - 1))}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 text-white font-bold text-lg transition-all"
            >
              −
            </button>
            <span className="text-3xl font-bold text-white w-12 text-center">{copies}</span>
            <button
              onClick={() => set('copies', Math.min(50, copies + 1))}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 text-white font-bold text-lg transition-all"
            >
              +
            </button>
            <span className="text-gray-500 text-sm ml-2">
              {copies > 1 ? `${copies} copies` : '1 copy'}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

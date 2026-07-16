import { useState } from 'react'
import { motion } from 'framer-motion'
import { ResumeProvider } from './resumeStore.jsx'
import ResumeForm     from './components/ResumeForm'
import ResumePreview  from './components/ResumePreview'
import TemplatePicker from './components/TemplatePicker'

const TABS = ['form', 'preview', 'templates']
const TAB_LABELS = { form: 'Details', preview: 'Preview', templates: 'Templates' }

export default function ResumeBuilder({ onPrint, onBack }) {
  const [mobileTab, setMobileTab] = useState('form')

  return (
    <ResumeProvider>
      <div className="flex flex-col h-full bg-[#0a0a0f]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 flex-shrink-0 bg-[#0a0a0f]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <p className="text-white font-bold text-sm">Resume Builder</p>
              <p className="text-gray-600 text-xs hidden sm:block">Build · Preview · Print</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-400 text-xs font-medium">Live Preview</span>
            </div>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="flex lg:hidden border-b border-white/5 flex-shrink-0 bg-[#0a0a0f]">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold transition-all ${
                mobileTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'form' && '📝 '}
              {tab === 'preview' && '👁 '}
              {tab === 'templates' && '🎨 '}
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* 3-panel body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Form */}
          <div className={`${
            mobileTab === 'form' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-72 xl:w-80 flex-shrink-0 flex-col border-r border-white/[0.05] overflow-y-auto scrollbar-thin bg-[#0a0a0f]`}>
            <div className="p-4">
              <ResumeForm />
            </div>
          </div>

          {/* CENTER — Preview */}
          <div className={`${
            mobileTab === 'preview' ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col overflow-hidden`}>
            <ResumePreview onPrint={onPrint} />
          </div>

          {/* RIGHT — Templates */}
          <div className={`${
            mobileTab === 'templates' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-56 xl:w-64 flex-shrink-0 flex-col border-l border-white/[0.05] overflow-y-auto scrollbar-thin bg-[#0a0a0f]`}>
            <div className="p-4">
              <TemplatePicker />
            </div>
          </div>
        </div>
      </div>
    </ResumeProvider>
  )
}

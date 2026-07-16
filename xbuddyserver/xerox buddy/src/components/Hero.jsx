import { motion } from 'framer-motion'

export default function Hero({ onGetStarted, onResumeBuilder }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-700 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full opacity-5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-3xl mx-auto z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Smart Campus Utility Platform
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight">
          <span className="gradient-text">X Buddy</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light mb-3">
          Print. Generate. Download. Done.
        </p>
        <p className="text-gray-500 text-base md:text-lg mb-10 max-w-xl mx-auto">
          Upload PDFs, generate letters instantly, print common forms — all in one smart campus platform.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-2xl text-lg glow-purple transition-all duration-200"
          >
            Print Now →
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onResumeBuilder}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-2xl text-lg border border-white/10 transition-all duration-200"
          >
            Build Resume ✦
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            href="#academic-toolkit"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-2xl text-lg border border-white/10 transition-all duration-200"
          >
            Academic Toolkit
          </motion.a>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 mt-14 text-center"
        >
          {[
            { label: 'B&W per page',    value: '₹2'      },
            { label: 'Color per page',  value: '₹5'      },
            { label: 'Quick Forms',     value: '8+'      },
            { label: 'Letter Types',    value: '6'       },
          ].map((stat) => (
            <div key={stat.label} className="glass px-6 py-3 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

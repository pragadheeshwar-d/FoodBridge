import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface Step {
  label: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number // 0-indexed
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8 select-none">
      {steps.map((step, index) => {
        const isPassed = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div key={index} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.08 : 1,
                  boxShadow: isCurrent ? '0 0 15px rgba(46, 125, 50, 0.3)' : 'none',
                }}
                transition={{ duration: 0.3 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isPassed
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'bg-primary text-white shadow-glow ring-2 ring-primary/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary border border-gray-200 dark:border-gray-700'
                }`}
              >
                {isPassed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <span
                className={`mt-2 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'text-primary'
                    : isPassed
                      ? 'text-text dark:text-gray-200'
                      : 'text-text-secondary/70'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="w-12 sm:w-20 h-1 mx-2 mt-[-1.25rem] bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{
                    width: isPassed ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

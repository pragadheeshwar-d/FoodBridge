import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  light?: boolean
}

export function Logo({ size = 'md', light = false }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', leaf: 'w-3.5 h-3.5' },
    md: { icon: 'w-8 h-8', text: 'text-xl', leaf: 'w-4 h-4' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', leaf: 'w-5 h-5' },
  }
  const s = sizes[size]

  return (
    <Link to="/" className="flex items-center gap-2.5 group select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
        className={`${s.icon} rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow transition-all duration-300 relative overflow-hidden`}
      >
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <Leaf className={`${s.leaf} text-white group-hover:scale-110 transition-transform duration-300`} />
        </motion.div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`${s.text} font-display font-extrabold tracking-tight ${light ? 'text-white' : 'text-text dark:text-white'}`}
      >
        Food<span className="text-primary font-black">Bridge</span>
      </motion.span>
    </Link>
  )
}

import { useState } from 'react'
import { X, Utensils, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'

interface UpdateFoodNeedModalProps {
  onClose: () => void
  currentNeed: {
    category: string
    neededMeals: number
    receivedMeals: number
    priority: string
    peopleToServe: number
    preferredDelivery: string
  }
  onSave: (updated: {
    category: string
    neededMeals: number
    priority: string
    peopleToServe: number
    preferredDelivery: string
  }) => void
}

export function UpdateFoodNeedModal({ onClose, currentNeed, onSave }: UpdateFoodNeedModalProps) {
  const [category, setCategory] = useState(currentNeed.category)
  const [neededMeals, setNeededMeals] = useState(currentNeed.neededMeals)
  const [priority, setPriority] = useState(currentNeed.priority)
  const [peopleToServe, setPeopleToServe] = useState(currentNeed.peopleToServe)
  const [preferredDelivery, setPreferredDelivery] = useState(currentNeed.preferredDelivery)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      onSave({
        category,
        neededMeals: Number(neededMeals),
        priority,
        peopleToServe: Number(peopleToServe),
        preferredDelivery,
      })
      setIsSubmitting(false)
      onClose()
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center border border-primary/30">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Update Current Food Need</h2>
              <p className="text-xs text-slate-400">Broadcast your real-time community food requirement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Active donors within 15 km will be alerted once you update this requirement.</span>
          </div>

          <Select
            label="Primary Requirement Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Rice / Meals', label: '🍚 Rice / Cooked Meals' },
              { value: 'Vegetarian Food', label: '🥗 Vegetarian Meals' },
              { value: 'Bread & Bakery', label: '🥖 Bread & Bakery' },
              { value: 'Dairy & Milk', label: '🥛 Dairy & Beverages' },
              { value: 'Fresh Fruits & Veg', label: '🍎 Fresh Produce / Fruits' },
              { value: 'Drinking Water', label: '💧 Drinking Water' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Meals Needed"
              type="number"
              min={1}
              value={neededMeals}
              onChange={(e) => setNeededMeals(Number(e.target.value))}
              required
            />
            <Input
              label="People to Serve"
              type="number"
              min={1}
              value={peopleToServe}
              onChange={(e) => setPeopleToServe(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urgency Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: 'High', label: '🔴 High Priority' },
                { value: 'Medium', label: '🟡 Medium Priority' },
                { value: 'Low', label: '🟢 Flexible / Standard' },
              ]}
            />
            <Select
              label="Preferred Delivery"
              value={preferredDelivery}
              onChange={(e) => setPreferredDelivery(e.target.value)}
              options={[
                { value: 'Today', label: 'Today (Immediate)' },
                { value: 'Tomorrow Lunch', label: 'Tomorrow Lunch (11:00 AM - 2:00 PM)' },
                { value: 'Tomorrow Dinner', label: 'Tomorrow Dinner (6:00 PM - 8:30 PM)' },
                { value: 'This Weekend', label: 'This Weekend' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={onClose} type="button" className="px-4 py-2 text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs">
              {isSubmitting ? 'Updating...' : 'Publish Need'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

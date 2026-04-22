'use client'
import { useState, useEffect } from 'react'

interface Weights {
  technical: number
  experience: number
  education: number
  soft_skills: number
  stability: number
}

interface Props {
  value: Weights
  onChange: (weights: Weights) => void
}

const LABELS: Record<keyof Weights, string> = {
  technical:  'Technical Skills',
  experience: 'Experience',
  education:  'Education',
  soft_skills:'Soft Skills',
  stability:  'Stability',
}

export default function WeightSliders({ value, onChange }: Props) {
  const total = Object.values(value).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  const update = (key: keyof Weights, val: number) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-3">
      {(Object.keys(LABELS) as (keyof Weights)[]).map(key => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-sm text-gray-700 w-36 shrink-0">{LABELS[key]}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={value[key]}
            onChange={e => update(key, Number(e.target.value))}
            className="flex-1 accent-[#1B4F8A]"
          />
          <span className="text-sm font-semibold text-[#1B4F8A] w-10 text-right">
            {value[key]}%
          </span>
        </div>
      ))}

      <div className={`text-sm font-semibold mt-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
        Total: {total}% {!isValid && '— must equal 100%'}
      </div>
    </div>
  )
}

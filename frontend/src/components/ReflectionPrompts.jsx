import { useState } from 'react'

export default function ReflectionPrompts({ prompts = [], onChange }) {
  const [responses, setResponses] = useState({})

  function handleChange(id, text) {
    const next = { ...responses, [id]: text }
    setResponses(next)
    onChange?.(next)
  }

  return (
    <div className="reflection-prompts">
      <h3>Reflection</h3>
      <p className="reflection-intro">
        Answer each prompt in a few sentences before submitting.
      </p>
      {prompts.map(p => (
        <div key={p.prompt_id} className="reflection-item">
          <label className="reflection-label">{p.text}</label>
          <textarea
            className="reflection-textarea"
            rows={4}
            value={responses[p.prompt_id] ?? ''}
            onChange={e => handleChange(p.prompt_id, e.target.value)}
            placeholder="Your response…"
          />
        </div>
      ))}
    </div>
  )
}
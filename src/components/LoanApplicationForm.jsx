import { useState, useRef, useEffect } from 'react'

const LOAN_TYPES = [
  { value: 'business', label: 'Бизнесийн зээл' },
  { value: 'car', label: 'Автомашин зээл' },
  { value: 'consumer', label: 'Хэрэглээний зээл' },
  { value: 'travel', label: 'Аяллын зээл' },
]

const BRANCHES = [
  { value: 'central', label: 'Төв салбар' },
  { value: '22avtokom', label: '22 автоком салбар' },
  { value: 'soyoolj', label: 'Соёолж салбар' },
  { value: 'diesel', label: 'Дизель хүрээ салбар' },
  { value: 'orkhon-bayanondor', label: 'Орхон Баян-Өндөр салбар' },
]

function CustomSelect({ options, placeholder, value, onChange, required, id }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const containerRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : ''
  const filteredOptions = filter
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(filter.toLowerCase())
      )
    : options

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="form-group custom-select-wrapper" ref={containerRef}>
      <label>
        {placeholder}
        {required && <span className="required"> *</span>}
      </label>
      <div
        className={`custom-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <input
          type="text"
          className="custom-select-input"
          value={open ? filter : displayValue}
          onChange={(e) => {
            setFilter(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          readOnly={!open}
          id={id}
        />
        <span className="custom-select-chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </span>
      </div>
      {open && (
        <div className="custom-select-dropdown">
          {filteredOptions.length ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className="custom-select-option"
                onClick={() => {
                  onChange(opt.value)
                  setFilter('')
                  setOpen(false)
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="custom-select-option empty">Олдсонгүй</div>
          )}
        </div>
      )}
    </div>
  )
}

const INITIAL_FORM = {
  surname: '',
  name: '',
  phone: '',
  loanType: '',
  branch: '',
  comment: '',
}

export default function LoanApplicationForm() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
    setSubmitMessage(null)
  }

  const validate = () => {
    const next = {}
    if (!form.surname.trim()) next.surname = 'Заавал бөглөнө үү'
    if (!form.name.trim()) next.name = 'Заавал бөглөнө үү'
    if (!form.phone.trim()) next.phone = 'Заавал бөглөнө үү'
    if (!form.loanType) next.loanType = 'Зээлийн төрөл сонгоно уу'
    if (!form.branch) next.branch = 'Салбар сонгоно уу'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitMessage(null)
    if (!validate()) return

    const loanTypeLabel = LOAN_TYPES.find((o) => o.value === form.loanType)?.label || form.loanType
    const branchLabel = BRANCHES.find((o) => o.value === form.branch)?.label || form.branch

    setSubmitting(true)
    try {
      const res = await fetch('/api/send-zeel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surname: form.surname.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          loanType: form.loanType,
          loanTypeLabel,
          branch: form.branch,
          branchLabel,
          comment: form.comment.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitMessage({ type: 'error', text: data.error || 'Илгээхэд алдаа гарлаа. Дахин оролдоно уу.' })
        return
      }
      setSubmitMessage({ type: 'success', text: 'Таны хүсэлт амжилттай илгээгдлээ. Манай зээлийн эдийн засагч тантай холбогдох болно.' })
      setForm(INITIAL_FORM)
    } catch (_) {
      setSubmitMessage({ type: 'error', text: 'Холболт амжилтгүй. Дахин оролдоно уу.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="loan-form-card">
      <div className="loan-form-logo">
        <img src="/logo.png" alt="Logo" onError={(e) => e.target.closest('.loan-form-logo').style.display = 'none'} />
      </div>
      <h1 className="loan-form-title">ЗЭЭЛИЙН ХҮСЭЛТ</h1>
      <p className="loan-form-intro">
        Та доорх цахим зээлийн хүсэлтийн мэдээллийг үнэн зөв бөглөж илгээнэ үү!
        Таны илгээсэн мэдээллийн дагуу манай зээлийн эдийн засагч тантай
        холбогдох болно.
      </p>

      <form onSubmit={handleSubmit} className="loan-form">
        <div className="form-group">
          <label htmlFor="surname">
            Таны овог <span className="required">*</span>
          </label>
          <input
            id="surname"
            type="text"
            placeholder="Таны овог"
            value={form.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            className={errors.surname ? 'error' : ''}
          />
          {errors.surname && (
            <span className="field-error">{errors.surname}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="name">
            Таны нэр <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Таны нэр"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">
            Холбоо барих утасны дугаар <span className="required">*</span>
          </label>
          <div className={`phone-input-wrap ${errors.phone ? 'error' : ''}`}>
            <span className="phone-prefix">+976</span>
            <input
              id="phone"
              type="tel"
              placeholder=""
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 8))}
              className={errors.phone ? 'error' : ''}
            />
          </div>
          {errors.phone && (
            <span className="field-error">{errors.phone}</span>
          )}
        </div>

        <CustomSelect
          id="loanType"
          placeholder="Зээлийн төрөл сонгох..."
          options={LOAN_TYPES}
          value={form.loanType}
          onChange={(v) => handleChange('loanType', v)}
          required
        />
        {errors.loanType && (
          <span className="field-error">{errors.loanType}</span>
        )}

        <CustomSelect
          id="branch"
          placeholder="Зээл авах салбар сонгох"
          options={BRANCHES}
          value={form.branch}
          onChange={(v) => handleChange('branch', v)}
          required
        />
        {errors.branch && (
          <span className="field-error">{errors.branch}</span>
        )}

        <div className="form-group">
          <label htmlFor="comment">Comment</label>
          <textarea
            id="comment"
            placeholder="Comment"
            value={form.comment}
            onChange={(e) => handleChange('comment', e.target.value)}
            rows={4}
          />
        </div>

        {submitMessage && (
          <div className={`submit-message ${submitMessage.type}`}>
            {submitMessage.text}
          </div>
        )}
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Илгээж байна...' : 'ХҮСЭЛТ ИЛГЭЭХ'}
        </button>
      </form>
    </div>
  )
}

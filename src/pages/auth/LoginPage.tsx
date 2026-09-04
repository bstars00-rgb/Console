import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/brand/Logo'
import { login } from '../../auth/session'
import { LANGUAGES, getLang, setLang, tLogin, type LangCode } from '../../i18n/lang'
import { writeJSON } from '../../lib/storage'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  stay: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [lang, setLangState] = useState<LangCode>(getLang())
  const [authError, setAuthError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', stay: false },
  })

  const onSubmit = (values: FormValues) => {
    setAuthError(null)
    const res = login(values.email, values.password)
    if (!res.ok) {
      setAuthError(res.error ?? 'Login failed')
      return
    }
    writeJSON('staySignedIn', !!values.stay)
    navigate('/vendor/booking', { replace: true })
  }

  const onLangChange = (code: LangCode) => {
    setLang(code)
    setLangState(code)
  }

  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center pt-[86px] px-4">
      {/* Language selector above the card, right-aligned to card width */}
      <div className="w-[360px] max-w-full mb-3 flex justify-end">
        <select
          aria-label="Language"
          value={lang}
          onChange={(e) => onLangChange(e.target.value as LangCode)}
          className="h-[30px] rounded border border-line bg-white px-2 pr-6 text-base text-ink outline-none focus:border-primary"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-[360px] max-w-full rounded bg-white border border-line shadow-card px-8 py-9">
        <div className="flex flex-col items-center">
          <Logo height={74} />
          <h1 className="mt-4 text-caption font-medium tracking-wide text-muted text-center">
            {tLogin('tagline', lang)}
          </h1>
        </div>

        <form className="mt-6 flex flex-col gap-2.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <input
              type="text"
              placeholder={tLogin('email', lang)}
              autoComplete="username"
              className="h-control w-full rounded border border-line px-2.5 text-base outline-none placeholder:text-faint focus:border-primary"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-caption text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder={tLogin('password', lang)}
              autoComplete="current-password"
              className="h-control w-full rounded border border-line px-2.5 text-base outline-none placeholder:text-faint focus:border-primary"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-caption text-danger">{errors.password.message}</p>
            )}
          </div>

          {authError && (
            <p className="text-caption text-danger" role="alert">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-control w-full rounded bg-primary text-white text-base font-medium transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {tLogin('login', lang)}
          </button>

          <label className="mt-0.5 flex items-center gap-1.5 text-base text-muted select-none">
            <input type="checkbox" className="accent-primary h-3.5 w-3.5" {...register('stay')} />
            {tLogin('stay', lang)}
          </label>
        </form>

        <div className="mt-4 border-t border-line-soft pt-3 flex flex-col gap-2">
          <button
            type="button"
            className="text-left text-base text-muted hover:text-ink"
            onClick={() =>
              setNotice(
                'Password recovery is mocked in this prototype. Enter your email and a reset link would be sent.',
              )
            }
          >
            {tLogin('forgot', lang)}
          </button>
          <button
            type="button"
            className="text-left text-base text-muted hover:text-ink"
            onClick={() => setNotice('Account creation is handled by Ohmyhotel onboarding (mocked here).')}
          >
            {tLogin('create', lang)}
          </button>
          {notice && <p className="text-caption text-info">{notice}</p>}
        </div>
      </div>
    </div>
  )
}

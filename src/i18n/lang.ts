/**
 * Lightweight language handling. The original console offers Default(AUTO),
 * English, 한국어, 中文, 日本語, Tiếng Việt. We persist the choice and expose
 * a small dictionary. Full app-wide translation is out of scope for the
 * prototype; login + shell chrome are translated to demonstrate the feature.
 */
import { readJSON, writeJSON } from '../lib/storage'
import type { LangCode } from '../auth/session'

export type { LangCode }

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: 'AUTO', label: 'Default (account setting)' },
  { code: 'EN', label: 'English' },
  { code: 'KO', label: '한국어' },
  { code: 'ZH', label: '中文' },
  { code: 'JA', label: '日本語' },
  { code: 'VI', label: 'Tiếng Việt' },
]

const LANG_KEY = 'lang'

export function getLang(): LangCode {
  return readJSON<LangCode>(LANG_KEY, 'AUTO')
}

export function setLang(code: LangCode): void {
  writeJSON(LANG_KEY, code)
}

/** AUTO resolves to English in the prototype. */
function resolve(code: LangCode): Exclude<LangCode, 'AUTO'> {
  return code === 'AUTO' ? 'EN' : code
}

type Dict = Record<Exclude<LangCode, 'AUTO'>, string>

const strings: Record<string, Dict> = {
  tagline: {
    EN: 'YOUR CONTENT, YOUR WAY, AS SIMPLE AS THAT',
    KO: '당신의 콘텐츠를, 당신의 방식대로, 아주 간단하게',
    ZH: '您的内容，您的方式，就这么简单',
    JA: 'あなたのコンテンツを、あなたの思いのままに、シンプルに',
    VI: 'NỘI DUNG CỦA BẠN, THEO CÁCH CỦA BẠN, ĐƠN GIẢN NHƯ VẬY',
  },
  email: { EN: 'Email address', KO: '이메일 주소', ZH: '电子邮箱', JA: 'メールアドレス', VI: 'Địa chỉ email' },
  password: { EN: 'Password', KO: '비밀번호', ZH: '密码', JA: 'パスワード', VI: 'Mật khẩu' },
  login: { EN: 'Log in', KO: '로그인', ZH: '登录', JA: 'ログイン', VI: 'Đăng nhập' },
  stay: { EN: 'Stay signed in', KO: '로그인 상태 유지', ZH: '保持登录', JA: 'ログイン状態を保持', VI: 'Duy trì đăng nhập' },
  forgot: { EN: 'Forgot your password?', KO: '비밀번호를 잊으셨나요?', ZH: '忘记密码？', JA: 'パスワードをお忘れですか？', VI: 'Quên mật khẩu?' },
  create: {
    EN: 'Don’t have an account? Create one',
    KO: '계정이 없으신가요? 계정 만들기',
    ZH: '还没有账户？创建一个',
    JA: 'アカウントをお持ちでないですか？作成する',
    VI: 'Chưa có tài khoản? Tạo mới',
  },
}

export function tLogin(key: keyof typeof strings, code: LangCode): string {
  return strings[key][resolve(code)]
}

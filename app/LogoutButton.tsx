'use client'

export default function LogoutButton() {
  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  return (
    <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
      Déconnexion
    </button>
  )
}

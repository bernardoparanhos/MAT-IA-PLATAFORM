import ReactDOM from 'react-dom'

export function AutoLogoutModal({ modalAberto, segundos, continuarSessao }) {
  if (!modalAberto) return null

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{ backgroundColor: '#1e2d3d', fontFamily: 'Outfit, sans-serif' }}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div className="text-center flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-orange-500">
            Sessão expirando
          </h2>
          <p className="text-sm text-slate-400">
            Você será desconectado por inatividade em
          </p>
        </div>

        <span className="text-5xl font-bold text-orange-500 tabular-nums">
          {mm}:{ss}
        </span>

        <button
          onClick={continuarSessao}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold text-sm"
        >
          Continuar sessão
        </button>
      </div>
    </div>,
    document.body
  )
}

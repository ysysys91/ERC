import TokenTester from './_components/TokenTester'

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              ERC
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                My Token DApp
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                Sepolia ERC-20 테스트 페이지
              </div>
            </div>
          </div>
          <a
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="https://sepolia.etherscan.io/"
            target="_blank"
            rel="noreferrer"
          >
            Sepolia Etherscan
          </a>
        </div>
      </header>

      <main className="flex-1">
        <TokenTester />
      </main>

      <footer className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-zinc-500 sm:px-6">
          지갑 연결 후 `transfer`, `approve`, `allowance`, `mint`,
          `multiTransfer` 기능을 테스트할 수 있습니다.
        </div>
      </footer>
    </div>
  )
}
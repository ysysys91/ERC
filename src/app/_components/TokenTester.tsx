'use client'

import { useMemo, useState } from 'react'
import { formatUnits, isAddress, parseUnits, zeroAddress } from 'viem'
import {
  useChainId,
  useConnection,
  useConnect,
  useConnectors,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'

import { contractABI, contractAddress } from '../contract'

function shortAddr(addr?: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-black/20 dark:border-white/10 dark:bg-zinc-900/30 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  )
}

function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const className =
    variant === 'primary'
      ? 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
      : variant === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300'
        : 'bg-white text-zinc-900 border border-black/10 hover:bg-zinc-50 disabled:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:border-white/10 dark:hover:bg-zinc-900/40'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-xl px-4 text-sm font-semibold transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

export default function TokenTester() {
  const chainId = useChainId()
  const isSepolia = chainId === sepolia.id

  const { address, isConnected } = useConnection()
  const connectors = useConnectors()
  const {
    mutate: connect,
    isPending: isConnecting,
    error: connectError,
  } = useConnect()
  const { mutate: disconnect } = useDisconnect()
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain()

  const { mutateAsync: writeContractAsync } = useWriteContract()

  const [lastHash, setLastHash] = useState<`0x${string}` | undefined>()
  const receipt = useWaitForTransactionReceipt({
    hash: lastHash,
    confirmations: 1,
    query: { enabled: Boolean(lastHash) },
  })

  const [watchAddress, setWatchAddress] = useState<string>('')
  const effectiveWatchAddress = useMemo(() => {
    if (watchAddress.trim().length === 0) return address
    return watchAddress.trim()
  }, [watchAddress, address])

  const tokenName = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'name',
  })
  const tokenSymbol = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'symbol',
  })
  const { data: decimalsData } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'decimals',
  } as const) as unknown as { data?: number | bigint }
  const totalSupply = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'totalSupply',
  })
  const owner = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'owner',
  })

  const isOwner =
    typeof owner.data === 'string' &&
    typeof address === 'string' &&
    owner.data.toLowerCase() === address.toLowerCase()

  const decimalsNum =
    typeof decimalsData === 'number'
      ? decimalsData
      : typeof decimalsData === 'bigint'
        ? Number(decimalsData)
        : 18

  const balance = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'balanceOf',
    args: [
      (isAddress(effectiveWatchAddress ?? '')
        ? effectiveWatchAddress
        : zeroAddress) as `0x${string}`,
    ],
    query: { enabled: Boolean(decimalsData) },
  })

  const supplyText =
    typeof totalSupply.data === 'bigint'
      ? formatUnits(totalSupply.data, decimalsNum)
      : '—'
  const balanceText =
    typeof balance.data === 'bigint'
      ? formatUnits(balance.data, decimalsNum)
      : '—'

  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  const [multiRecipient1, setMultiRecipient1] = useState('')
  const [multiAmount1, setMultiAmount1] = useState('')
  const [multiRecipient2, setMultiRecipient2] = useState('')
  const [multiAmount2, setMultiAmount2] = useState('')

  const [transferFromOwner, setTransferFromOwner] = useState('')
  const [transferFromTo, setTransferFromTo] = useState('')
  const [transferFromAmount, setTransferFromAmount] = useState('')

  const [approveSpender, setApproveSpender] = useState('')
  const [approveAmount, setApproveAmount] = useState('')

  const [allowOwner, setAllowOwner] = useState('')
  const [allowSpender, setAllowSpender] = useState('')
  const allowance = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'allowance',
    args: [
      (isAddress(allowOwner) ? allowOwner : zeroAddress) as `0x${string}`,
      (isAddress(allowSpender) ? allowSpender : zeroAddress) as `0x${string}`,
    ],
    query: { enabled: Boolean(allowOwner || allowSpender) && Boolean(decimalsData) },
  })
  const allowanceText =
    typeof allowance.data === 'bigint'
      ? formatUnits(allowance.data, decimalsNum)
      : '—'

  const [mintTo, setMintTo] = useState('')
  const [mintAmount, setMintAmount] = useState('')

  const canWrite = isConnected && isSepolia && !receipt.isLoading
  const canMint = canWrite && isOwner

  async function afterWrite(hash: `0x${string}`) {
    setLastHash(hash)
  }

  async function handleTransfer() {
    if (!isAddress(transferTo)) throw new Error('받는 주소가 올바르지 않습니다.')
    const value = parseUnits(transferAmount || '0', decimalsNum)
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: contractABI,
      functionName: 'transfer',
      args: [transferTo, value],
    })
    await afterWrite(hash)
  }

  async function handleMultiTransfer() {
    if (!isAddress(multiRecipient1)) {
      throw new Error('받는 주소 1이 올바르지 않습니다.')
    }
    if (!isAddress(multiRecipient2)) {
      throw new Error('받는 주소 2가 올바르지 않습니다.')
    }

    const value1 = parseUnits(multiAmount1 || '0', decimalsNum)
    const value2 = parseUnits(multiAmount2 || '0', decimalsNum)

    if (value1 <= BigInt(0) || value2 <= BigInt(0)) {
  throw new Error('전송 수량은 0보다 커야 합니다.')
}

    const hash = await writeContractAsync({
      address: contractAddress,
      abi: contractABI,
      functionName: 'multiTransfer',
      args: [
        [multiRecipient1, multiRecipient2],
        [value1, value2],
      ],
    })

    await afterWrite(hash)
  }

  async function handleApprove() {
    if (!isAddress(approveSpender)) throw new Error('spender 주소가 올바르지 않습니다.')
    const value = parseUnits(approveAmount || '0', decimalsNum)
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: contractABI,
      functionName: 'approve',
      args: [approveSpender, value],
    })
    await afterWrite(hash)
  }

  async function handleTransferFrom() {
    if (!isAddress(transferFromOwner))
      throw new Error('from(sender) 주소가 올바르지 않습니다.')
    if (!isAddress(transferFromTo)) throw new Error('to 주소가 올바르지 않습니다.')
    const value = parseUnits(transferFromAmount || '0', decimalsNum)
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: contractABI,
      functionName: 'transferFrom',
      args: [transferFromOwner, transferFromTo, value],
    })
    await afterWrite(hash)
  }

  async function handleMint() {
    if (!isAddress(mintTo)) throw new Error('받는 주소가 올바르지 않습니다.')
    const value = parseUnits(mintAmount || '0', decimalsNum)
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: contractABI,
      functionName: 'mint',
      args: [mintTo, value],
    })
    await afterWrite(hash)
  }

  const [actionError, setActionError] = useState<string>('')

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          ERC-20 토큰 테스트 (Sepolia)
        </h1>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          컨트랙트: <span className="font-mono">{contractAddress}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="지갑 / 네트워크">
          <div className="grid gap-3">
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900/30 dark:text-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">상태</div>
                <div>
                  {isConnected ? (
                    <span className="font-mono">{shortAddr(address)}</span>
                  ) : (
                    '연결 안 됨'
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-medium">체인</div>
                <div className="font-mono">
                  {chainId ? `#${chainId}` : '—'} {isSepolia ? '(Sepolia)' : ''}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isConnected ? (
                <Button
                  onClick={() => {
                    setActionError('')
                    const injectedConnector =
                      connectors.find((c) => c.id === 'injected') ?? connectors[0]
                    if (!injectedConnector) {
                      setActionError('Injected 지갑 커넥터를 찾지 못했습니다.')
                      return
                    }
                    connect({ connector: injectedConnector })
                  }}
                  disabled={isConnecting}
                >
                  {isConnecting ? '연결 중…' : 'MetaMask 연결'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActionError('')
                      disconnect()
                    }}
                  >
                    연결 해제
                  </Button>
                  {!isSepolia && (
                    <Button
                      onClick={() => {
                        setActionError('')
                        switchChain({ chainId: sepolia.id })
                      }}
                      disabled={isSwitching}
                    >
                      {isSwitching ? '전환 중…' : 'Sepolia로 전환'}
                    </Button>
                  )}
                </>
              )}
            </div>

            {connectError?.message ? (
              <div className="text-sm text-red-600">{connectError.message}</div>
            ) : null}
          </div>
        </Card>

        <Card title="토큰 정보">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-600 dark:text-zinc-400">이름</div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {(tokenName.data as string) ?? '—'}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-600 dark:text-zinc-400">심볼</div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {(tokenSymbol.data as string) ?? '—'}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-600 dark:text-zinc-400">decimals</div>
              <div className="font-mono text-zinc-900 dark:text-zinc-100">
                {decimalsData?.toString() ?? '—'}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-600 dark:text-zinc-400">totalSupply</div>
              <div className="font-mono text-zinc-900 dark:text-zinc-100">
                {supplyText}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-600 dark:text-zinc-400">owner</div>
              <div className="font-mono text-zinc-900 dark:text-zinc-100">
                {typeof owner.data === 'string' ? shortAddr(owner.data) : '—'}
              </div>
            </div>
          </div>
        </Card>

        <Card title="잔액 조회">
          <div className="grid gap-3">
            <Field
              label="조회할 주소 (비우면 내 지갑)"
              value={watchAddress}
              onChange={setWatchAddress}
              placeholder="0x..."
            />
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm dark:border-white/10 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between gap-3">
                <div className="text-zinc-600 dark:text-zinc-400">address</div>
                <div className="font-mono text-zinc-900 dark:text-zinc-100">
                  {effectiveWatchAddress ? shortAddr(effectiveWatchAddress) : '—'}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-zinc-600 dark:text-zinc-400">balance</div>
                <div className="font-mono text-zinc-900 dark:text-zinc-100">
                  {balanceText}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Transfer">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="to"
                value={transferTo}
                onChange={setTransferTo}
                placeholder="0x..."
              />
              <Field
                label="amount"
                value={transferAmount}
                onChange={setTransferAmount}
                placeholder={`예) 1.5 (${tokenSymbol.data ?? 'TOKEN'})`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    setActionError('')
                    await handleTransfer()
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : String(e))
                  }
                }}
                disabled={!canWrite}
              >
                전송
              </Button>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {isConnected
                  ? isSepolia
                    ? ''
                    : 'Sepolia로 전환 후 실행하세요.'
                  : '지갑 연결 후 실행하세요.'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Multi Transfer">
          <div className="grid gap-3">
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">
              여러 주소에게 ERC-20 토큰을 한 번의 트랜잭션으로 전송하는 추가
              기능입니다.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="받는 주소 1"
                value={multiRecipient1}
                onChange={setMultiRecipient1}
                placeholder="0x..."
              />
              <Field
                label="수량 1"
                value={multiAmount1}
                onChange={setMultiAmount1}
                placeholder={`예) 100 (${tokenSymbol.data ?? 'TOKEN'})`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="받는 주소 2"
                value={multiRecipient2}
                onChange={setMultiRecipient2}
                placeholder="0x..."
              />
              <Field
                label="수량 2"
                value={multiAmount2}
                onChange={setMultiAmount2}
                placeholder={`예) 50 (${tokenSymbol.data ?? 'TOKEN'})`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    setActionError('')
                    await handleMultiTransfer()
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : String(e))
                  }
                }}
                disabled={!canWrite}
              >
                일괄 전송
              </Button>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {isConnected
                  ? isSepolia
                    ? '두 주소에 한 번에 전송됩니다.'
                    : 'Sepolia로 전환 후 실행하세요.'
                  : '지갑 연결 후 실행하세요.'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="TransferFrom (spender)">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="from (sender)"
                value={transferFromOwner}
                onChange={setTransferFromOwner}
                placeholder="approve를 해준 토큰 소유자(보내는 사람) 주소"
              />
              <Field
                label="to"
                value={transferFromTo}
                onChange={setTransferFromTo}
                placeholder="받는 주소"
              />
            </div>
            <Field
              label="amount"
              value={transferFromAmount}
              onChange={setTransferFromAmount}
              placeholder={`예) 2 (${tokenSymbol.data ?? 'TOKEN'})`}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    setActionError('')
                    await handleTransferFrom()
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : String(e))
                  }
                }}
                disabled={!canWrite}
              >
                transferFrom 실행
              </Button>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {isConnected
                  ? isSepolia
                    ? '현재 연결된 지갑(=spender)으로 실행됩니다.'
                    : 'Sepolia로 전환 후 실행하세요.'
                  : '지갑 연결 후 실행하세요.'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Approve / Allowance">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="spender"
                  value={approveSpender}
                  onChange={setApproveSpender}
                  placeholder="0x..."
                />
                <Field
                  label="amount"
                  value={approveAmount}
                  onChange={setApproveAmount}
                  placeholder={`예) 10 (${tokenSymbol.data ?? 'TOKEN'})`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    try {
                      setActionError('')
                      await handleApprove()
                    } catch (e) {
                      setActionError(e instanceof Error ? e.message : String(e))
                    }
                  }}
                  disabled={!canWrite}
                >
                  approve 실행
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/30">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="owner"
                  value={allowOwner}
                  onChange={setAllowOwner}
                  placeholder="0x..."
                />
                <Field
                  label="spender"
                  value={allowSpender}
                  onChange={setAllowSpender}
                  placeholder="0x..."
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">
                  allowance
                </div>
                <div className="font-mono text-zinc-900 dark:text-zinc-100">
                  {allowanceText}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Mint (owner-only)">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="to"
                value={mintTo}
                onChange={setMintTo}
                placeholder="0x..."
              />
              <Field
                label="amount"
                value={mintAmount}
                onChange={setMintAmount}
                placeholder={`예) 100 (${tokenSymbol.data ?? 'TOKEN'})`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    setActionError('')
                    await handleMint()
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : String(e))
                  }
                }}
                disabled={!canMint}
              >
                mint 실행
              </Button>
            </div>
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">
              `mint(address,uint256)`가 ABI에 포함되어 있어 노출해뒀어요. 권한이
              없으면 트랜잭션이 revert 될 수 있습니다.
            </p>
            {!isOwner && isConnected ? (
              <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                현재 지갑은 컨트랙트 owner가 아니라서 mint를 실행할 수 없습니다.
              </p>
            ) : null}
          </div>
        </Card>

        <Card title="트랜잭션 상태">
          <div className="grid gap-3 text-sm">
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between gap-3">
                <div className="text-zinc-600 dark:text-zinc-400">last hash</div>
                <div className="font-mono text-zinc-900 dark:text-zinc-100">
                  {lastHash ? shortAddr(lastHash) : '—'}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-zinc-600 dark:text-zinc-400">status</div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {!lastHash
                    ? '대기'
                    : receipt.isLoading
                      ? '확인 중…'
                      : receipt.isSuccess
                        ? '성공'
                        : receipt.isError
                          ? '실패'
                          : '—'}
                </div>
              </div>
            </div>

            {actionError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {actionError}
              </div>
            ) : null}

            {receipt.error?.message ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {receipt.error.message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setLastHash(undefined)
                  setActionError('')
                }}
                disabled={!lastHash || receipt.isLoading}
              >
                상태 초기화
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
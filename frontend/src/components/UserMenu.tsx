import { Crown, LogOut, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/components/AuthProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  onOpenPricing: () => void
  onOpenAccount: () => void
}

export function UserMenu({ onOpenPricing, onOpenAccount }: UserMenuProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-secondary"
          aria-label={user.email}
        >
          {user.picture ? (
            <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : (
            <span className="text-sm font-bold">{(user.name ?? user.email)[0]?.toUpperCase()}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs font-medium text-primary">
            {t(`plans.${user.plan}`)}
          </p>
        </div>
        <DropdownMenuItem onSelect={onOpenAccount}>
          <UserRound className="size-4" />
          {t('account.title')}
        </DropdownMenuItem>
        {user.plan !== 'premium' && (
          <DropdownMenuItem onSelect={onOpenPricing}>
            <Crown className="size-4 text-amber-500" />
            {t('pricing.upgrade')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="size-4" />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

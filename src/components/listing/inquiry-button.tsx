'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Mail, MessageCircle } from 'lucide-react'

interface InquiryButtonProps {
  listingId: string
  userId: string | null
  listingTitle: string
}

const contactMethods = [
  { value: 'EMAIL', labelKey: 'methods.email', icon: Mail },
  { value: 'LINE', labelKey: 'methods.line', icon: MessageCircle },
  { value: 'WHATSAPP', labelKey: 'methods.whatsapp', icon: MessageCircle },
  { value: 'WECHAT', labelKey: 'methods.wechat', icon: MessageCircle },
]

export function InquiryButton({ listingId, userId, listingTitle }: InquiryButtonProps) {
  const t = useTranslations('inquiry')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [contactMethod, setContactMethod] = useState('EMAIL')
  const [contactValue, setContactValue] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getContactPlaceholder = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return t('emailPlaceholder')
      case 'LINE':
        return t('lineIdPlaceholder')
      case 'WHATSAPP':
        return t('whatsappPlaceholder')
      case 'WECHAT':
        return t('wechatPlaceholder')
      default:
        return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      router.push(`/login?redirect=/listings/${listingId}`)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          contactMethod,
          contactValue,
          message,
        }),
      })

      if (!res.ok) throw new Error()

      toast.success(t('success'))
      setMessage('')
      setContactValue('')
    } catch {
      toast.error(tCommon('error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{listingTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('contactMethod')}</Label>
            <Select value={contactMethod} onValueChange={setContactMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {t(method.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('contactValue')}</Label>
            <Input
              type={contactMethod === 'EMAIL' ? 'email' : 'text'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={getContactPlaceholder(contactMethod)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('message')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? tCommon('loading') : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

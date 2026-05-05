'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getHospitalityCategoryOptions,
  getHospitalityListingsCopy,
  getHospitalityPropertyTypeOptions,
} from '@/lib/hospitality-copy'
import {
  getStationsForLine,
  normalizeRailwayLine,
  type PublicSearchLocationIndex,
} from '@/lib/public-search'
import {
  translateCityName,
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'

interface ListingFiltersProps {
  locationIndex: PublicSearchLocationIndex
}

export function ListingFilters({ locationIndex }: ListingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('search')
  const tListing = useTranslations('listing')
  const copy = getHospitalityListingsCopy(locale)
  const propertyTypes = getHospitalityPropertyTypeOptions(locale)
  const hospitalityCategories = getHospitalityCategoryOptions(locale)
  const categoryFilterLabels: Record<string, string> = {
    ja: '宿泊事業カテゴリ',
    en: 'Hospitality category',
    'zh-TW': '住宿業類別',
    'zh-CN': '住宿业类别',
  }
  const categoryAllLabels: Record<string, string> = {
    ja: '全カテゴリ',
    en: 'All categories',
    'zh-TW': '全部類別',
    'zh-CN': '全部类别',
  }
  const categoryFilterLabel = categoryFilterLabels[locale] ?? categoryFilterLabels.en
  const categoryAllLabel = categoryAllLabels[locale] ?? categoryAllLabels.en

  const walkMinutesOptions = [
    { value: '5', labelKey: 'walkMinutes5' },
    { value: '10', labelKey: 'walkMinutes10' },
    { value: '15', labelKey: 'walkMinutes15' },
  ]

  const areaOptions = [
    { value: '20', label: '20㎡+' },
    { value: '50', label: '50㎡+' },
    { value: '100', label: '100㎡+' },
    { value: '200', label: '200㎡+' },
  ]

  const priceRangeValues = [10000000, 30000000, 50000000, 100000000, 300000000, 500000000, 1000000000]
  const priceRanges = priceRangeValues.map((value) => ({
    value: String(value),
    label: locale === 'en'
      ? (value >= 1_000_000_000 ? `¥${value / 1_000_000_000}B` : `¥${value / 1_000_000}M`)
      : (value >= 100_000_000 ? `¥${value / 100_000_000}億` : `¥${(value / 10_000).toLocaleString()}万`),
  }))

  const sortOptions = [
    { value: 'newest', labelKey: 'sortNewest' },
    { value: 'price_asc', labelKey: 'sortPriceAsc' },
    { value: 'price_desc', labelKey: 'sortPriceDesc' },
  ]

  const selectedLine = normalizeRailwayLine(searchParams.get('line'))
  const stationOptions = getStationsForLine(locationIndex, selectedLine)

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    if (Object.prototype.hasOwnProperty.call(updates, 'ward')) {
      params.delete('prefecture')
    }

    params.delete('page')
    router.push(`/listings?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateFilters({ q: String(formData.get('q') || '') })
  }

  const clearFilters = () => {
    router.push('/listings')
  }

  return (
    <Card className="rounded-[8px] border-[#d9d2bd] bg-[#fffdf8] shadow-sm">
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full md:cursor-default"
        >
          <CardTitle className="text-lg">{copy.filtersTitle}</CardTitle>
          <span className="md:hidden">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </span>
        </button>
        <p className="text-sm leading-6 text-muted-foreground">
          {copy.filtersDescription}
        </p>
      </CardHeader>
      <CardContent className={`space-y-4 ${!isExpanded ? 'hidden md:block' : ''}`}>
        <form onSubmit={handleSearch}>
          <div className="flex gap-2">
            <Input
              name="q"
              placeholder={t('keyword')}
              defaultValue={searchParams.get('q') || ''}
              className="rounded-[8px]"
            />
            <Button type="submit" size="icon" className="rounded-[8px]">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <Label>{categoryFilterLabel}</Label>
          <Select
            value={searchParams.get('category') || 'all'}
            onValueChange={(value) => updateFilters({ category: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={categoryAllLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{categoryAllLabel}</SelectItem>
              {hospitalityCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{tListing('propertyType')}</Label>
          <Select
            value={searchParams.get('type') || 'all'}
            onValueChange={(value) => updateFilters({ type: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes')}</SelectItem>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('area')}</Label>
          <Select
            value={searchParams.get('ward') || 'all'}
            onValueChange={(value) => updateFilters({ ward: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('allTokyo13Wards')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTokyo13Wards')}</SelectItem>
              {locationIndex.wards.map((ward) => (
                <SelectItem key={ward} value={ward}>
                  {translateCityName(ward, locale) || ward}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('line')}</Label>
          <Select
            value={selectedLine || 'all'}
            onValueChange={(value) => updateFilters({
              line: value === 'all' ? '' : normalizeRailwayLine(value),
              station: '',
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('allLines')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allLines')}</SelectItem>
              {locationIndex.lines.map((line) => (
                <SelectItem key={line} value={line}>
                  {translateRailwayLine(line, locale) || line}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('station')}</Label>
          <Select
            value={searchParams.get('station') || 'all'}
            onValueChange={(value) => updateFilters({ station: value === 'all' ? '' : value })}
            disabled={!selectedLine}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedLine ? t('allStations') : t('selectLineFirst')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {selectedLine ? t('allStations') : t('selectLineFirst')}
              </SelectItem>
              {stationOptions.map((station) => (
                <SelectItem key={station} value={station}>
                  {translateStationName(station, locale) || station}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('priceMin')}</Label>
          <Select
            value={searchParams.get('priceMin') || 'none'}
            onValueChange={(value) => updateFilters({ priceMin: value === 'none' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('noMin')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('noMin')}</SelectItem>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('priceMax')}</Label>
          <Select
            value={searchParams.get('priceMax') || 'none'}
            onValueChange={(value) => updateFilters({ priceMax: value === 'none' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('noMax')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('noMax')}</SelectItem>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('walkMinutes')}</Label>
          <Select
            value={searchParams.get('walkMax') || 'all'}
            onValueChange={(value) => updateFilters({ walkMax: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('walkMinutesAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('walkMinutesAll')}</SelectItem>
              {walkMinutesOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('buildingAreaMin')}</Label>
          <Select
            value={searchParams.get('areaMin') || 'all'}
            onValueChange={(value) => updateFilters({ areaMin: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('buildingAreaAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('buildingAreaAll')}</SelectItem>
              {areaOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('sort')}</Label>
          <Select
            value={searchParams.get('sort') || 'newest'}
            onValueChange={(value) => updateFilters({ sort: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full rounded-[8px]" onClick={clearFilters}>
          {t('clearFilters')}
        </Button>
      </CardContent>
    </Card>
  )
}

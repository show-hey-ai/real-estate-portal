import { LeadStatus, ListingStatus } from '@prisma/client'
import { z } from 'zod'

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_IMPORT_FILE_BYTES = 50 * 1024 * 1024

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
const IMPORT_MIME_TYPES = new Set([
  'application/pdf',
  ...IMAGE_MIME_TYPES,
])

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

function hasExtension(fileName: string, extensions: string[]) {
  const lowerFileName = fileName.toLowerCase()
  return extensions.some((extension) => lowerFileName.endsWith(extension))
}

function isValidDateInput(value: string) {
  return !Number.isNaN(Date.parse(value))
}

const optionalShortText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(255).optional()
)

const optionalLongText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(10000).optional()
)

const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().finite().min(0).optional()
)

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).optional()
)

const optionalNonNegativeInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional()
)

const optionalYear = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1800).max(2100).optional()
)

const optionalMonth = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(12).optional()
)

const optionalDateInput = z.preprocess(
  emptyToUndefined,
  z.string().trim().refine(isValidDateInput, 'Invalid date').optional()
)

const stationDraftSchema = z
  .object({
    name: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    line: optionalShortText,
    walk_minutes: optionalNonNegativeInt,
    walkMinutes: optionalNonNegativeInt,
  })
  .strict()
  .transform((station) => {
    if (!station.name) return null

    return {
      name: station.name,
      line: station.line ?? null,
      walk_minutes: station.walk_minutes ?? station.walkMinutes ?? null,
    }
  })

const optionalStations = z
  .preprocess((value) => value ?? undefined, z.array(stationDraftSchema).max(20).optional())
  .transform((stations) => stations?.filter((station): station is NonNullable<typeof station> => station !== null))

const optionalStringArray = z
  .preprocess((value) => value ?? undefined, z.array(z.string().trim().min(1)).max(50).optional())
  .transform((values) => (values ? Array.from(new Set(values)) : undefined))

const listingBodySchema = z
  .object({
    propertyType: optionalShortText,
    price: optionalNonNegativeNumber,
    addressPublic: optionalShortText,
    addressPrivate: optionalShortText,
    prefecture: optionalShortText,
    city: optionalShortText,
    stations: optionalStations,
    landArea: optionalNonNegativeNumber,
    buildingArea: optionalNonNegativeNumber,
    floorCount: optionalPositiveInt,
    builtYear: optionalYear,
    builtMonth: optionalMonth,
    structure: optionalShortText,
    zoning: optionalShortText,
    currentStatus: optionalShortText,
    yieldGross: optionalNonNegativeNumber,
    yieldNet: optionalNonNegativeNumber,
    infoRegisteredAt: optionalDateInput,
    infoUpdatedAt: optionalDateInput,
    conditionsExpiry: optionalDateInput,
    deliveryDate: optionalShortText,
    descriptionJa: optionalLongText,
    descriptionEn: optionalLongText,
    descriptionZhTw: optionalLongText,
    descriptionZhCn: optionalLongText,
    adminNotes: z.preprocess(
      (value) => {
        if (value === undefined) return undefined
        if (value === null) return null
        if (typeof value === 'string' && value.trim() === '') return null
        return value
      },
      z.string().trim().max(5000).nullable().optional()
    ),
    adAllowed: z.boolean().optional(),
    status: z.nativeEnum(ListingStatus).optional(),
    adoptedMediaIds: optionalStringArray,
    images: optionalStringArray,
  })
  .strict()

export const adminListingCreateSchema = listingBodySchema.extend({
  propertyType: z.string().trim().min(1, 'Property type is required').max(255),
  price: z.coerce.number().finite().min(0, 'Price must be 0 or greater'),
  addressPublic: z.string().trim().min(1, 'Public address is required').max(255),
  addressPrivate: z.string().trim().min(1, 'Private address is required').max(255),
})

export const adminListingUpdateSchema = listingBodySchema.refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  {
    message: 'At least one field is required',
  }
)

export const adminLeadUpdateSchema = z
  .object({
    status: z.nativeEnum(LeadStatus).optional(),
    adminNotes: z.preprocess(
      (value) => {
        if (value === undefined) return undefined
        if (value === null) return null
        if (typeof value === 'string' && value.trim() === '') return null
        return value
      },
      z.string().trim().max(5000).nullable().optional()
    ),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.adminNotes !== undefined, {
    message: 'At least one field is required',
  })

export const adminTranslateRequestSchema = z
  .object({
    text: z.string().trim().min(1, 'Text is required').max(5000, 'Text is too long'),
  })
  .strict()

function validateFile(
  file: File | null,
  options: {
    maxBytes: number
    mimeTypes: Set<string>
    extensions: string[]
  }
) {
  if (!file) return 'No file provided'
  if (file.size <= 0) return 'Empty file'
  if (file.size > options.maxBytes) {
    return `File is too large (max ${Math.floor(options.maxBytes / 1024 / 1024)}MB)`
  }

  if (
    !options.mimeTypes.has(file.type) &&
    !hasExtension(file.name, options.extensions)
  ) {
    return 'Unsupported file type'
  }

  return null
}

export function validateAdminMediaUploadFile(file: File | null) {
  return validateFile(file, {
    maxBytes: MAX_IMAGE_UPLOAD_BYTES,
    mimeTypes: IMAGE_MIME_TYPES,
    extensions: IMAGE_EXTENSIONS,
  })
}

export function validateAdminImportFile(file: File | null) {
  return validateFile(file, {
    maxBytes: MAX_IMPORT_FILE_BYTES,
    mimeTypes: IMPORT_MIME_TYPES,
    extensions: ['.pdf', ...IMAGE_EXTENSIONS],
  })
}

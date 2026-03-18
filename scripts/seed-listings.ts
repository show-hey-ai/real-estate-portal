import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import cuid from 'cuid'

config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleListings = [
  {
    status: 'PUBLISHED',
    propertyType: '区分マンション',
    price: BigInt(28000000),
    addressPublic: '東京都港区赤坂2丁目',
    addressPrivate: '東京都港区赤坂2-5-10',
    prefecture: '東京都',
    city: '港区',
    stations: [
      { name: '赤坂', line: '東京メトロ千代田線', walk_minutes: 3 },
      { name: '溜池山王', line: '東京メトロ銀座線', walk_minutes: 5 },
    ],
    landArea: null,
    buildingArea: 45.5,
    floorCount: 12,
    builtYear: 2015,
    structure: 'RC',
    zoning: '商業地域',
    currentStatus: '賃貸中',
    yieldGross: 5.2,
    viewCount: 156,
    publishedAt: new Date('2024-12-15'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '一棟マンション',
    price: BigInt(380000000),
    addressPublic: '東京都新宿区西新宿3丁目',
    addressPrivate: '東京都新宿区西新宿3-12-8',
    prefecture: '東京都',
    city: '新宿区',
    stations: [
      { name: '新宿', line: 'JR山手線', walk_minutes: 8 },
      { name: '都庁前', line: '都営大江戸線', walk_minutes: 4 },
    ],
    landArea: 280.0,
    buildingArea: 850.0,
    floorCount: 8,
    builtYear: 2008,
    structure: 'SRC',
    zoning: '商業地域',
    currentStatus: '満室',
    yieldGross: 6.8,
    viewCount: 342,
    publishedAt: new Date('2024-12-10'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '戸建',
    price: BigInt(52000000),
    addressPublic: '神奈川県横浜市青葉区美しが丘1丁目',
    addressPrivate: '神奈川県横浜市青葉区美しが丘1-22-15',
    prefecture: '神奈川県',
    city: '横浜市青葉区',
    stations: [
      { name: 'たまプラーザ', line: '東急田園都市線', walk_minutes: 6 },
    ],
    landArea: 120.5,
    buildingArea: 95.8,
    floorCount: 2,
    builtYear: 2018,
    structure: '木造',
    zoning: '第一種低層住居専用地域',
    currentStatus: '空室',
    yieldGross: null,
    viewCount: 89,
    publishedAt: new Date('2024-12-18'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '一棟アパート',
    price: BigInt(78000000),
    addressPublic: '埼玉県さいたま市大宮区桜木町2丁目',
    addressPrivate: '埼玉県さいたま市大宮区桜木町2-8-3',
    prefecture: '埼玉県',
    city: 'さいたま市大宮区',
    stations: [
      { name: '大宮', line: 'JR京浜東北線', walk_minutes: 7 },
    ],
    landArea: 180.0,
    buildingArea: 320.0,
    floorCount: 3,
    builtYear: 2012,
    structure: '軽量鉄骨造',
    zoning: '近隣商業地域',
    currentStatus: '賃貸中',
    yieldGross: 7.5,
    viewCount: 124,
    publishedAt: new Date('2024-12-12'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '店舗・事務所',
    price: BigInt(145000000),
    addressPublic: '東京都渋谷区渋谷1丁目',
    addressPrivate: '東京都渋谷区渋谷1-15-20',
    prefecture: '東京都',
    city: '渋谷区',
    stations: [
      { name: '渋谷', line: 'JR山手線', walk_minutes: 2 },
      { name: '渋谷', line: '東京メトロ銀座線', walk_minutes: 3 },
    ],
    landArea: null,
    buildingArea: 180.0,
    floorCount: null,
    builtYear: 2005,
    structure: 'S',
    zoning: '商業地域',
    currentStatus: '賃貸中',
    yieldGross: 4.8,
    viewCount: 278,
    publishedAt: new Date('2024-12-08'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '土地',
    price: BigInt(95000000),
    addressPublic: '東京都世田谷区成城5丁目',
    addressPrivate: '東京都世田谷区成城5-18-7',
    prefecture: '東京都',
    city: '世田谷区',
    stations: [
      { name: '成城学園前', line: '小田急線', walk_minutes: 8 },
    ],
    landArea: 220.0,
    buildingArea: null,
    floorCount: null,
    builtYear: null,
    structure: null,
    zoning: '第一種低層住居専用地域',
    currentStatus: '更地',
    yieldGross: null,
    viewCount: 67,
    publishedAt: new Date('2024-12-16'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '区分マンション',
    price: BigInt(18500000),
    addressPublic: '大阪府大阪市中央区難波3丁目',
    addressPrivate: '大阪府大阪市中央区難波3-5-12',
    prefecture: '大阪府',
    city: '大阪市中央区',
    stations: [
      { name: 'なんば', line: '大阪メトロ御堂筋線', walk_minutes: 4 },
      { name: '難波', line: '南海本線', walk_minutes: 6 },
    ],
    landArea: null,
    buildingArea: 32.5,
    floorCount: 15,
    builtYear: 2010,
    structure: 'RC',
    zoning: '商業地域',
    currentStatus: '賃貸中',
    yieldGross: 6.2,
    viewCount: 198,
    publishedAt: new Date('2024-12-14'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '一棟マンション',
    price: BigInt(520000000),
    addressPublic: '東京都品川区東五反田2丁目',
    addressPrivate: '東京都品川区東五反田2-10-5',
    prefecture: '東京都',
    city: '品川区',
    stations: [
      { name: '五反田', line: 'JR山手線', walk_minutes: 5 },
      { name: '大崎広小路', line: '東急池上線', walk_minutes: 3 },
    ],
    landArea: 350.0,
    buildingArea: 1200.0,
    floorCount: 10,
    builtYear: 2019,
    structure: 'RC',
    zoning: '商業地域',
    currentStatus: '満室',
    yieldGross: 5.5,
    viewCount: 412,
    publishedAt: new Date('2024-12-05'),
  },
  {
    status: 'PUBLISHED',
    propertyType: '戸建',
    price: BigInt(35000000),
    addressPublic: '千葉県船橋市本町4丁目',
    addressPrivate: '千葉県船橋市本町4-22-8',
    prefecture: '千葉県',
    city: '船橋市',
    stations: [
      { name: '船橋', line: 'JR総武線', walk_minutes: 10 },
      { name: '京成船橋', line: '京成本線', walk_minutes: 8 },
    ],
    landArea: 85.0,
    buildingArea: 72.5,
    floorCount: 2,
    builtYear: 2016,
    structure: '木造',
    zoning: '第一種住居地域',
    currentStatus: '空室',
    yieldGross: null,
    viewCount: 56,
    publishedAt: new Date('2024-12-19'),
  },
  {
    status: 'DRAFT',
    propertyType: '区分マンション',
    price: BigInt(42000000),
    addressPublic: '東京都目黒区自由が丘1丁目',
    addressPrivate: '東京都目黒区自由が丘1-8-15',
    prefecture: '東京都',
    city: '目黒区',
    stations: [
      { name: '自由が丘', line: '東急東横線', walk_minutes: 4 },
      { name: '自由が丘', line: '東急大井町線', walk_minutes: 4 },
    ],
    landArea: null,
    buildingArea: 55.0,
    floorCount: 8,
    builtYear: 2020,
    structure: 'RC',
    zoning: '商業地域',
    currentStatus: '賃貸中',
    yieldGross: 4.5,
    viewCount: 0,
    publishedAt: null,
  },
]

// サンプル画像URL（Unsplashのプレースホルダー）
const sampleImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
]

async function main() {
  console.log('Seeding listings...')

  for (let i = 0; i < sampleListings.length; i++) {
    const data = sampleListings[i]

    // Prismaのカラム名はcamelCase、IDは手動生成
    const listingId = cuid()
    const now = new Date().toISOString()
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        id: listingId,
        status: data.status,
        propertyType: data.propertyType,
        price: data.price.toString(),
        addressPublic: data.addressPublic,
        addressPrivate: data.addressPrivate,
        prefecture: data.prefecture,
        city: data.city,
        stations: data.stations,
        landArea: data.landArea,
        buildingArea: data.buildingArea,
        floorCount: data.floorCount,
        builtYear: data.builtYear,
        structure: data.structure,
        zoning: data.zoning,
        currentStatus: data.currentStatus,
        yieldGross: data.yieldGross,
        viewCount: data.viewCount,
        publishedAt: data.publishedAt?.toISOString(),
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (error) {
      console.error(`Error creating listing: ${error.message}`)
      continue
    }

    // 各物件に3枚の画像を追加
    const imageCategories = ['EXTERIOR', 'INTERIOR', 'FLOORPLAN']
    for (let j = 0; j < 3; j++) {
      const { error: mediaError } = await supabase
        .from('media')
        .insert({
          id: cuid(),
          listingId: listing.id,
          url: sampleImages[(i + j) % sampleImages.length],
          category: imageCategories[j],
          isAdopted: true,
          sortOrder: j,
          source: 'MANUAL',
        })

      if (mediaError) {
        console.error(`Error creating media: ${mediaError.message}`)
      }
    }

    console.log(`Created listing: ${data.addressPublic}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export type TemplateType = 'background' | 'product' | 'stationery' | 'sns'

export type BlendMode = 'multiply' | 'screen' | 'normal'

export interface Template {
  id: string
  type: TemplateType
  labelKey: string
  free: boolean
  // 배경 전용
  bgUrl?: string
  color?: string
  // 제품 목업 전용
  mockupUrl?: string
  placement?: { x: number; y: number; w: number; h: number }  // 0~1 비율
  outputW?: number
  outputH?: number
  blend?: BlendMode   // 목업 합성 블렌드 모드 (기본: multiply)
}

export const TEMPLATES: Template[] = [
  // ── 배경 (Background) ─────────────────────────────────────
  { id: 'white',    type: 'background', labelKey: 'white',    free: true,  color: '#ffffff' },
  { id: 'wood',     type: 'background', labelKey: 'wood',     free: true,  bgUrl: 'https://images.unsplash.com/photo-1516992654410-9309d4587e94?w=800&q=80' },
  { id: 'cafe',     type: 'background', labelKey: 'cafe',     free: true,  bgUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80' },
  { id: 'forest',   type: 'background', labelKey: 'forest',   free: true,  bgUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
  { id: 'gray',     type: 'background', labelKey: 'gray',     free: true,  color: 'linear-gradient(135deg,#e8e8e8,#c8c8c8)' },
  { id: 'black',    type: 'background', labelKey: 'black',    free: true,  color: '#1a1a2e' },
  { id: 'pastel',   type: 'background', labelKey: 'pastel',   free: true,  color: 'linear-gradient(135deg,#fce4ec,#f8bbd9)' },
  { id: 'cement',   type: 'background', labelKey: 'cement',   free: true,  bgUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80' },
  { id: 'spring',   type: 'background', labelKey: 'spring',   free: false, bgUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc5e?w=800&q=80' },
  { id: 'summer',   type: 'background', labelKey: 'summer',   free: false, bgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { id: 'autumn',   type: 'background', labelKey: 'autumn',   free: false, bgUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80' },
  { id: 'winter',   type: 'background', labelKey: 'winter',   free: false, bgUrl: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800&q=80' },
  { id: 'marble',   type: 'background', labelKey: 'marble',   free: false, bgUrl: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800&q=80' },
  { id: 'gradientBlue',   type: 'background', labelKey: 'gradientBlue',   free: false, color: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { id: 'gradientOrange', type: 'background', labelKey: 'gradientOrange', free: false, color: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { id: 'luxury',   type: 'background', labelKey: 'luxury',   free: false, color: 'linear-gradient(135deg,#b8860b,#ffd700)' },
  { id: 'tech',     type: 'background', labelKey: 'tech',     free: false, color: 'linear-gradient(135deg,#0f0c29,#302b63)' },
  { id: 'minimal1', type: 'background', labelKey: 'minimal1', free: false, color: '#f5f0e8' },
  { id: 'minimal2', type: 'background', labelKey: 'minimal2', free: false, color: '#8fbc8f' },
  { id: 'neon',     type: 'background', labelKey: 'neon',     free: false, bgUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80' },
  { id: 'vintage',  type: 'background', labelKey: 'vintage',  free: false, bgUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&q=80' },

  // ── 의류/굿즈 (Product) ────────────────────────────────────
  {
    id: 'tshirt_white', type: 'product', labelKey: 'tshirtWhite', free: true,
    mockupUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=90',
    placement: { x: 0.31, y: 0.20, w: 0.38, h: 0.32 },
    outputW: 1000, outputH: 1000, blend: 'multiply',
  },
  {
    id: 'tshirt_black', type: 'product', labelKey: 'tshirtBlack', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&q=90',
    placement: { x: 0.31, y: 0.20, w: 0.38, h: 0.32 },
    outputW: 1000, outputH: 1000, blend: 'screen',
  },
  {
    id: 'hoodie', type: 'product', labelKey: 'hoodie', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1000&q=90',
    placement: { x: 0.32, y: 0.22, w: 0.36, h: 0.28 },
    outputW: 1000, outputH: 1000, blend: 'multiply',
  },
  {
    id: 'cap', type: 'product', labelKey: 'cap', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1000&q=90',
    placement: { x: 0.36, y: 0.33, w: 0.28, h: 0.18 },
    outputW: 1000, outputH: 750, blend: 'multiply',
  },
  {
    id: 'mug', type: 'product', labelKey: 'mug', free: true,
    mockupUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1000&q=90',
    placement: { x: 0.26, y: 0.30, w: 0.48, h: 0.36 },
    outputW: 1000, outputH: 800, blend: 'multiply',
  },
  {
    id: 'tote_bag', type: 'product', labelKey: 'toteBag', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&q=90',
    placement: { x: 0.30, y: 0.26, w: 0.40, h: 0.38 },
    outputW: 800, outputH: 1000, blend: 'multiply',
  },
  {
    id: 'phone_case', type: 'product', labelKey: 'phoneCase', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=90',
    placement: { x: 0.24, y: 0.24, w: 0.52, h: 0.52 },
    outputW: 800, outputH: 1000, blend: 'multiply',
  },
  {
    id: 'notebook', type: 'product', labelKey: 'notebook', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=1000&q=90',
    placement: { x: 0.30, y: 0.24, w: 0.40, h: 0.48 },
    outputW: 1000, outputH: 800, blend: 'multiply',
  },

  // ── 문구/패키지 (Stationery) ───────────────────────────────
  {
    id: 'business_card', type: 'stationery', labelKey: 'businessCard', free: true,
    mockupUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=90',
    placement: { x: 0.14, y: 0.28, w: 0.72, h: 0.44 },
    outputW: 1200, outputH: 800, blend: 'multiply',
  },
  {
    id: 'sticker_round', type: 'stationery', labelKey: 'stickerRound', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=90',
    placement: { x: 0.27, y: 0.27, w: 0.46, h: 0.46 },
    outputW: 800, outputH: 800, blend: 'multiply',
  },
  {
    id: 'paper_bag', type: 'stationery', labelKey: 'paperBag', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=800&q=90',
    placement: { x: 0.26, y: 0.22, w: 0.48, h: 0.36 },
    outputW: 800, outputH: 1000, blend: 'multiply',
  },
  {
    id: 'envelope', type: 'stationery', labelKey: 'envelope', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=90',
    placement: { x: 0.22, y: 0.32, w: 0.56, h: 0.36 },
    outputW: 1200, outputH: 800, blend: 'multiply',
  },
  {
    id: 'box_package', type: 'stationery', labelKey: 'boxPackage', free: false,
    mockupUrl: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&q=90',
    placement: { x: 0.22, y: 0.20, w: 0.56, h: 0.44 },
    outputW: 800, outputH: 800, blend: 'multiply',
  },

  // ── SNS 프레임 (SNS) ──────────────────────────────────────
  {
    id: 'sns_insta_feed', type: 'sns', labelKey: 'snsInstaFeed', free: true,
    color: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
    placement: { x: 0.15, y: 0.15, w: 0.70, h: 0.70 },
    outputW: 1080, outputH: 1080, blend: 'normal',
  },
  {
    id: 'sns_insta_story', type: 'sns', labelKey: 'snsInstaStory', free: false,
    color: 'linear-gradient(180deg,#1a1a2e,#16213e)',
    placement: { x: 0.15, y: 0.32, w: 0.70, h: 0.36 },
    outputW: 1080, outputH: 1920, blend: 'normal',
  },
  {
    id: 'sns_kakao', type: 'sns', labelKey: 'snsKakao', free: false,
    color: '#FEE500',
    placement: { x: 0.22, y: 0.26, w: 0.56, h: 0.48 },
    outputW: 1200, outputH: 675, blend: 'normal',
  },
  {
    id: 'sns_youtube', type: 'sns', labelKey: 'snsYoutube', free: false,
    color: 'linear-gradient(135deg,#FF0000,#CC0000)',
    placement: { x: 0.18, y: 0.22, w: 0.64, h: 0.56 },
    outputW: 2560, outputH: 1440, blend: 'normal',
  },
]

export const TEMPLATE_CATEGORIES = ['background', 'product', 'stationery', 'sns'] as const
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]

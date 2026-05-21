import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Slide, VideoProject, BrandingConfig, TitleSlide, ListSlide, GridSlide, TagSlide, OutroSlide } from './types';
import { DEFAULT_BRANDING, DEFAULT_SLIDE_DURATION, TITLE_SLIDE_DURATION, OUTRO_SLIDE_DURATION, VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT, COLORS } from './constants';

function createDefaultTitle(): TitleSlide {
  return {
    id: nanoid(), type: 'title', durationInFrames: TITLE_SLIDE_DURATION,
    icon: '💻', title: 'Computer', titleAccent: 'Work',
    bullets: [{ icon: '💬', text: 'Không chỉ là một ', boldText: 'cỗ máy biết trả lời câu hỏi hay hơn' }],
  };
}

function createDefaultList(): ListSlide {
  return {
    id: nanoid(), type: 'list', durationInFrames: DEFAULT_SLIDE_DURATION,
    icon: '🎨', title: 'Tốc Độ', titleAccent: 'Phản Hồi',
    bullets: [
      { icon: '🔥', text: 'Điểm đáng tiền nhất của đợt ra mắt ', boldText: 'nằm ở độ trễ' },
      { icon: '⚡', text: 'Trả lời nhanh hơn ', boldText: 'gấp 2 lần so với phiên bản trước' },
      { icon: '🚀', text: 'Streaming response ', boldText: 'mượt mà không giật lag' },
    ],
  };
}

function createDefaultGrid(): GridSlide {
  return {
    id: nanoid(), type: 'grid', durationInFrames: DEFAULT_SLIDE_DURATION,
    icon: '⌨️', title: 'Sân Chơi', titleAccent: 'Codex',
    items: [
      { icon: '🏗️', text: 'Nhớ context tốt hơn qua hàng ngàn dòng code' },
      { icon: '💎', text: 'Dùng ít token hơn cho cùng một tác vụ' },
      { icon: '🤖', text: 'Tự biết đoán trước lúc nào cần kiểm thử' },
      { icon: '🔍', text: 'Tự động review mã nguồn mượt mà' },
    ],
  };
}

function createDefaultTag(): TagSlide {
  return {
    id: nanoid(), type: 'tag', durationInFrames: DEFAULT_SLIDE_DURATION,
    icon: '🔥', title: 'Claude', titleAccent: 'Opus 4.7',
    subtitle: 'AI Biết Tự Kiểm Tra Đỡ Phải Trông Hơn',
    tags: [
      { text: '#LongRunning', color: COLORS.accent },
      { text: '#Vision3x', color: COLORS.accentPurple },
      { text: '#SelfVerify', color: COLORS.accentOrange },
    ],
  };
}

function createDefaultOutro(): OutroSlide {
  return {
    id: nanoid(), type: 'outro', durationInFrames: OUTRO_SLIDE_DURATION,
    platform: 'tiktok', username: 'escbasexyz',
  };
}

const defaultSlides: Slide[] = [createDefaultTitle(), createDefaultList(), createDefaultGrid(), createDefaultTag(), createDefaultOutro()];

interface EditorState {
  project: VideoProject;
  selectedSlideId: string | null;
  isRendering: boolean;
  renderProgress: number;
  audioBlobUrl: string | null;  // local blob URL for preview audio
  currentFrame: number;  // current playback position for timeline sync

  // Slide actions
  selectSlide: (id: string | null) => void;
  addSlide: (type: Slide['type']) => void;
  removeSlide: (id: string) => void;
  updateSlide: (id: string, updates: Partial<Slide>) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  duplicateSlide: (id: string) => void;

  // Branding actions
  updateBranding: (updates: Partial<BrandingConfig>) => void;

  // Audio actions
  setAudio: (blobUrl: string | null, volume?: number) => void;

  // Project actions
  setProject: (project: VideoProject) => void;
  getTotalFrames: () => number;

  // Render state
  setRendering: (isRendering: boolean) => void;
  setRenderProgress: (progress: number) => void;
  setCurrentFrame: (frame: number) => void;

  // Player ref (set by PreviewPanel, used by Timeline for seeking)
  _playerRef: any;
}

const getInitialBranding = (): BrandingConfig => {
  try {
    const saved = localStorage.getItem('videoBranding');
    if (saved) return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
  } catch (e) {}
  return { ...DEFAULT_BRANDING };
};

export const useEditorStore = create<EditorState>((set, get) => ({
  project: {
    id: nanoid(),
    name: 'Untitled Video',
    slides: defaultSlides,
    branding: getInitialBranding(),
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
  },
  selectedSlideId: defaultSlides[0].id,
  isRendering: false,
  renderProgress: 0,
  audioBlobUrl: null,
  currentFrame: 0,
  _playerRef: null,

  selectSlide: (id) => set({ selectedSlideId: id }),

  addSlide: (type) => {
    const creators: Record<string, () => Slide> = {
      title: createDefaultTitle, list: createDefaultList,
      grid: createDefaultGrid, tag: createDefaultTag, outro: createDefaultOutro,
    };
    const newSlide = creators[type]();
    set((state) => ({
      project: { ...state.project, slides: [...state.project.slides, newSlide] },
      selectedSlideId: newSlide.id,
    }));
  },

  removeSlide: (id) => set((state) => {
    const slides = state.project.slides.filter((s) => s.id !== id);
    return {
      project: { ...state.project, slides },
      selectedSlideId: state.selectedSlideId === id ? (slides[0]?.id ?? null) : state.selectedSlideId,
    };
  }),

  updateSlide: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      slides: state.project.slides.map((s) => (s.id === id ? { ...s, ...updates } as Slide : s)),
    },
  })),

  moveSlide: (fromIndex, toIndex) => set((state) => {
    const slides = [...state.project.slides];
    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);
    return { project: { ...state.project, slides } };
  }),

  duplicateSlide: (id) => set((state) => {
    const idx = state.project.slides.findIndex((s) => s.id === id);
    if (idx === -1) return state;
    const dup = { ...state.project.slides[idx], id: nanoid() } as Slide;
    const slides = [...state.project.slides];
    slides.splice(idx + 1, 0, dup);
    return { project: { ...state.project, slides }, selectedSlideId: dup.id };
  }),

  updateBranding: (updates) => set((state) => {
    const newBranding = { ...state.project.branding, ...updates };
    try {
      localStorage.setItem('videoBranding', JSON.stringify(newBranding));
    } catch (e) {}
    return {
      project: { ...state.project, branding: newBranding },
    };
  }),

  setAudio: (blobUrl, volume = 1) => set((state) => {
    // Revoke previous blob URL to free memory
    if (state.audioBlobUrl) URL.revokeObjectURL(state.audioBlobUrl);
    return {
      audioBlobUrl: blobUrl,
      project: {
        ...state.project,
        audio: blobUrl ? { src: blobUrl, volume } : undefined,
      },
    };
  }),

  setProject: (project) => set({ project, selectedSlideId: project.slides[0]?.id ?? null }),

  getTotalFrames: () => get().project.slides.reduce((sum, s) => sum + s.durationInFrames, 0),

  setRendering: (isRendering) => set({ isRendering }),
  setRenderProgress: (renderProgress) => set({ renderProgress }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
}));

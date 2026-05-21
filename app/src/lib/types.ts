export type SlideType = 'title' | 'list' | 'grid' | 'tag' | 'outro';
export type Platform = 'tiktok' | 'youtube' | 'instagram';

export interface BulletItem {
  icon: string;
  text: string;
  boldText: string;
  delay?: number; // frames from slide start (calculated from SRT timestamps)
}

export interface GridItem {
  icon: string;
  text: string;
  delay?: number;
}

export interface TagItem {
  text: string;
  color: string;
  delay?: number;
}

interface SlideBase {
  id: string;
  type: SlideType;
  durationInFrames: number;
}

export interface TitleSlide extends SlideBase {
  type: 'title';
  icon: string;
  title: string;
  titleAccent: string;
  bullets: BulletItem[];
}

export interface ListSlide extends SlideBase {
  type: 'list';
  icon: string;
  title: string;
  titleAccent: string;
  bullets: BulletItem[];
}

export interface GridSlide extends SlideBase {
  type: 'grid';
  icon: string;
  title: string;
  titleAccent: string;
  items: GridItem[];
}

export interface TagSlide extends SlideBase {
  type: 'tag';
  icon: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  tags: TagItem[];
}

export interface OutroSlide extends SlideBase {
  type: 'outro';
  platform: Platform;
  username: string;
}

export type Slide = TitleSlide | ListSlide | GridSlide | TagSlide | OutroSlide;

export interface BrandingConfig {
  username: string;
  accentColor: string;
  logoUrl?: string;
  theme?: 'dark' | 'light';
}

export interface AudioConfig {
  src: string;
  volume: number;
}

export interface VideoProject {
  id: string;
  name: string;
  slides: Slide[];
  branding: BrandingConfig;
  audio?: AudioConfig;
  fps: number;
  width: number;
  height: number;
}

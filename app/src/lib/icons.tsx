import React from 'react';
import * as LucideIcons from 'lucide-react';

// Build a lookup record from Lucide exports (only icon components)
// Lucide icons are ForwardRef components (objects, not functions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, React.FC<any>> = {};
for (const [key, val] of Object.entries(LucideIcons)) {
  if (val && key[0] === key[0].toUpperCase() && key !== 'default'
    && (typeof val === 'function' || (typeof val === 'object' && '$$typeof' in (val as object)))) {
    iconMap[key] = val as React.FC;
  }
}

/**
 * Dynamic Lucide icon renderer — resolves icon name string to component
 */
interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  size = 28,
  color = 'currentColor',
  strokeWidth = 2,
}) => {
  const IconComponent = iconMap[name] || LucideIcons.CircleDot;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
};

/**
 * Icon mapping for manufacturing / business / reporting topics
 * Used by auto-generation to pick contextually relevant icons
 */
export const TOPIC_ICONS: Record<string, string[]> = {
  // Manufacturing & Production
  manufacturing: ['Factory', 'Cog', 'Wrench', 'Hammer', 'HardHat', 'PackageCheck', 'Boxes'],
  production: ['Factory', 'Activity', 'Gauge', 'Timer', 'Workflow', 'GitBranch'],
  quality: ['ShieldCheck', 'BadgeCheck', 'CheckCircle2', 'ScanLine', 'Microscope'],
  maintenance: ['Wrench', 'Settings', 'Cog', 'Hammer', 'RefreshCcw', 'AlertTriangle'],

  // Data & Reporting
  report: ['FileSpreadsheet', 'FileText', 'ClipboardList', 'ScrollText', 'BookOpen'],
  chart: ['BarChart3', 'BarChart2', 'PieChart', 'TrendingUp', 'LineChart', 'AreaChart'],
  data: ['Database', 'Table2', 'Grid3X3', 'Layers', 'Binary', 'Braces'],
  analysis: ['TrendingUp', 'TrendingDown', 'ArrowUpRight', 'Target', 'Crosshair', 'Telescope'],
  dashboard: ['LayoutDashboard', 'MonitorDot', 'Gauge', 'Activity', 'PanelTopClose'],

  // Time & Schedule
  time: ['Clock', 'Timer', 'CalendarDays', 'History', 'Hourglass', 'AlarmClock'],
  delay: ['Clock', 'Hourglass', 'Timer', 'AlertCircle', 'Pause'],
  schedule: ['CalendarDays', 'CalendarClock', 'ListTodo', 'CheckSquare'],

  // Issues & Alerts
  problem: ['AlertTriangle', 'AlertCircle', 'ShieldAlert', 'Bug', 'CircleX'],
  error: ['XCircle', 'AlertOctagon', 'Ban', 'ShieldX', 'CircleAlert'],
  warning: ['AlertTriangle', 'TriangleAlert', 'Info', 'Bell', 'Siren'],

  // Solutions & Actions
  solution: ['Lightbulb', 'Sparkles', 'Zap', 'Rocket', 'ArrowRight'],
  improvement: ['TrendingUp', 'ArrowUpRight', 'Rocket', 'Gauge', 'Award'],
  automation: ['Bot', 'Cpu', 'Workflow', 'RefreshCcw', 'Repeat2', 'Wand2'],
  technology: ['Cpu', 'Monitor', 'Smartphone', 'Wifi', 'Cloud', 'Server'],

  // Business & Finance
  cost: ['DollarSign', 'Coins', 'PiggyBank', 'Receipt', 'Banknote'],
  profit: ['TrendingUp', 'BadgeDollarSign', 'CircleDollarSign', 'Gem'],
  customer: ['Users', 'UserCheck', 'HeartHandshake', 'MessageCircle', 'Star'],
  inventory: ['Package', 'Boxes', 'Warehouse', 'PackageSearch', 'Archive'],

  // People & Team
  team: ['Users', 'UserCog', 'UsersRound', 'Handshake', 'Contact'],
  manager: ['UserCog', 'Crown', 'Shield', 'BadgeCheck', 'UserCheck'],
  worker: ['HardHat', 'User', 'UserRound', 'Briefcase'],

  // Documents & Info
  document: ['FileText', 'FileSpreadsheet', 'Files', 'FolderOpen', 'Paperclip'],
  info: ['Info', 'HelpCircle', 'MessageSquare', 'BookOpen', 'GraduationCap'],
  list: ['List', 'ListOrdered', 'ListChecks', 'ListTodo', 'ClipboardList'],

  // Misc
  success: ['CheckCircle2', 'ThumbsUp', 'Trophy', 'Medal', 'PartyPopper'],
  general: ['Circle', 'Square', 'Star', 'Bookmark', 'Tag', 'Hash'],
};

/**
 * Vietnamese keyword → topic mapping for auto icon selection
 */
const VN_KEYWORD_MAP: Record<string, string> = {
  // Manufacturing
  'sản xuất': 'manufacturing', 'nhà máy': 'manufacturing', 'xưởng': 'manufacturing',
  'máy móc': 'manufacturing', 'dây chuyền': 'production', 'công đoạn': 'production',
  'chất lượng': 'quality', 'kiểm tra': 'quality', 'phế phẩm': 'quality',
  'bảo trì': 'maintenance', 'sửa chữa': 'maintenance', 'hỏng': 'maintenance',

  // Data & Reports
  'báo cáo': 'report', 'dữ liệu': 'data', 'số liệu': 'data',
  'biểu đồ': 'chart', 'thống kê': 'chart', 'phân tích': 'analysis',
  'dashboard': 'dashboard', 'bảng điều khiển': 'dashboard',

  // Time
  'thời gian': 'time', 'trễ': 'delay', 'chậm': 'delay', 'độ trễ': 'delay',
  'lịch': 'schedule', 'tiến độ': 'schedule', 'deadline': 'schedule',

  // Issues
  'lỗi': 'error', 'sai': 'error', 'vấn đề': 'problem', 'sự cố': 'problem',
  'cảnh báo': 'warning', 'nguy hiểm': 'warning', 'rủi ro': 'warning',

  // Solutions
  'giải pháp': 'solution', 'cải tiến': 'improvement', 'nâng cấp': 'improvement',
  'tự động': 'automation', 'công nghệ': 'technology', 'phần mềm': 'technology',
  'thông minh': 'technology', 'hiện đại': 'technology',

  // Business
  'chi phí': 'cost', 'tiền': 'cost', 'lợi nhuận': 'profit', 'doanh thu': 'profit',
  'khách hàng': 'customer', 'đơn hàng': 'customer',
  'kho': 'inventory', 'vật tư': 'inventory', 'tồn kho': 'inventory',

  // People
  'nhân viên': 'worker', 'công nhân': 'worker', 'quản lý': 'manager', 'sếp': 'manager',
  'đội': 'team', 'nhóm': 'team',

  // General
  'tài liệu': 'document', 'hồ sơ': 'document',
  'thông tin': 'info', 'hướng dẫn': 'info',
  'danh sách': 'list', 'mục': 'list',
  'thành công': 'success', 'hoàn thành': 'success',
};

/**
 * Auto-pick an icon name based on text content (Vietnamese-aware)
 */
export function pickIconForText(text: string, usedIcons: Set<string> = new Set()): string {
  const lowerText = text.toLowerCase();

  // Find matching topic by scanning Vietnamese keywords
  let bestTopic = 'general';
  let bestMatchLen = 0;

  for (const [keyword, topic] of Object.entries(VN_KEYWORD_MAP)) {
    if (lowerText.includes(keyword) && keyword.length > bestMatchLen) {
      bestTopic = topic;
      bestMatchLen = keyword.length;
    }
  }

  // Pick an icon from the topic that hasn't been used yet
  const candidates = TOPIC_ICONS[bestTopic] || TOPIC_ICONS.general;
  for (const icon of candidates) {
    if (!usedIcons.has(icon)) {
      usedIcons.add(icon);
      return icon;
    }
  }

  // All used? Return first candidate
  return candidates[0];
}

/**
 * Slide-level icon based on slide type + content
 */
export function pickSlideIcon(type: string, titleText: string): string {
  switch (type) {
    case 'title': return 'Presentation';
    case 'grid': return 'LayoutGrid';
    case 'tag': return 'Tags';
    case 'outro': return 'Clapperboard';
    default: break;
  }

  // For 'list' type, pick based on content
  const lowerTitle = titleText.toLowerCase();
  for (const [keyword, topic] of Object.entries(VN_KEYWORD_MAP)) {
    if (lowerTitle.includes(keyword)) {
      const icons = TOPIC_ICONS[topic];
      return icons?.[0] || 'List';
    }
  }
  return 'ListChecks';
}

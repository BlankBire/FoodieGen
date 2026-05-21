/* ─── API CONSTANTS ─── */

export const VISUAL_STYLES = [
  { id: 'cinematic', label: 'Cinematic'  },
  { id: 'golden',    label: 'Golden Hour' },
  { id: 'closeup',   label: 'Close-Up'   },
  { id: 'dreamy',    label: 'Dreamy'     },
  { id: 'vibrant',   label: 'Vibrant'    },
  { id: 'minimal',   label: 'Minimal'    },
  { id: 'rustic',    label: 'Rustic'     },
  { id: 'luxury',    label: 'Luxury'     },
  { id: 'vintage',   label: 'Vintage'    },
];

export const TONES = [
  'Kích thích', 'Sang trọng', 'Cảm xúc', 'Bán hàng', 
  'Viral', 'Review', 'Giáo dục', 'Kể chuyện', 'Hài hước'
];

export const EMOTIONS = [
  'Vui tươi', 'Sang trọng', 'Ấm cúng', 'Phấn khích', 
  'Bình yên', 'Mãnh liệt', 'Bí ẩn', 'Tươi mới'
];

export const VOICES = [
  { id: 'leminh',    label: 'Nam miền Bắc',  gender: 'Nam' },
  { id: 'banmai',    label: 'Nữ miền Bắc',  gender: 'Nữ'  },
  { id: 'giahuy',    label: 'Nam miền Trung', gender: 'Nam' },
  { id: 'myan',      label: 'Nữ miền Trung',   gender: 'Nữ'  },
  { id: 'minhquang', label: 'Nam miền Nam', gender: 'Nam' },
  { id: 'lannhi',    label: 'Nữ miền Nam',   gender: 'Nữ'  },
];

export const CHARACTERS = [
  {
    id: 'male_chef',
    label: 'Nam đầu bếp tận tâm',
    gender: 'Nam',
    defaultDescription: 'Nam đầu bếp mặc đồng phục trắng sạch sẽ, mũ cao, tay nghề điêu luyện, gương mặt tập trung nhưng hiền hậu, đam mê nấu nướng và luôn chú trọng đến sự hoàn mỹ trong từng món ăn.',
    englishDescription: 'A male chef with straight jet-black hair, dark brown almond-shaped eyes, smooth warm golden skin tone, and refined Southeast Asian facial bone structure. Wearing a clean white chef uniform and tall chef hat. Focused yet gentle expression.'
  },
  {
    id: 'lady_consultant',
    label: 'Nữ nhân viên tư vấn sành điệu',
    gender: 'Nữ',
    defaultDescription: 'Nữ nhân viên tư vấn, trang phục chỉnh tề, nụ cười tỏa nắng, nhiệt tình giới thiệu các món đặc sản cho khách.',
    englishDescription: 'A stylish female consultant with straight jet-black hair, dark brown almond-shaped eyes, smooth warm golden skin tone, and delicate Southeast Asian facial bone structure. Wearing elegant professional attire. Radiant welcoming smile.'
  },
  {
    id: 'food_reviewer',
    label: 'Food Reviewer năng động',
    gender: 'Nam',
    defaultDescription: 'Một Food Reviewer trẻ trung, cá tính, cách nói chuyện lôi cuốn, hài hước, gương mặt rạng rỡ khi thưởng thức món ăn và luôn tìm tòi những góc quay độc đáo.',
    englishDescription: 'A dynamic young male food reviewer with short straight black hair, dark brown eyes, warm golden skin tone, and youthful Southeast Asian facial features. Wearing a casual energetic outfit. Vivid expressive reactions, charismatic and engaging personality.'
  },
  {
    id: 'female_vlogger',
    label: 'Bạn trẻ sành ăn (Vlogger)',
    gender: 'Nữ',
    defaultDescription: 'Bạn trẻ Gen Z sành điệu, phong cách năng động, thích khám phá các món ăn xu hướng, biểu cảm tự nhiên và lôi cuốn trước ống kính.',
    englishDescription: 'A trendy Gen Z female vlogger with long straight jet-black hair, dark almond-shaped eyes, smooth warm skin tone, and youthful Southeast Asian facial features. Wearing modern casual fashion. Natural expressive captivating on-camera personality.'
  },
  {
    id: 'friendly_owner',
    label: 'Chủ quán hiếu khách',
    gender: 'Nam',
    defaultDescription: 'Chủ quán trung niên, gương mặt hiền hậu, hay cười, trang phục giảng dị, trực tiếp chuẩn bị món ăn với sự tận tâm như phục vụ người thân trong gia đình.',
    englishDescription: 'A middle-aged male restaurant owner with black hair, dark kind eyes, warm medium skin tone, and approachable Southeast Asian facial features. Wearing simple casual clothing. Warm hospitable smile, family-style warmth.'
  },
  {
    id: 'mom_chef',
    label: 'Mẹ đảm đang nội trợ',
    gender: 'Nữ',
    defaultDescription: 'Người mẹ nội trợ dịu dàng, trang phục ở nhà gọn gàng, khéo léo chế biến những món ăn gia đình đầy yêu thương, gương mặt hạnh phúc.',
    englishDescription: 'A motherly female figure with black hair tied neatly, gentle dark brown eyes, smooth warm skin tone, and soft Southeast Asian facial features. Wearing comfortable home attire. Loving and happy expression.'
  },
  { 
    id: 'ai_character', 
    label: 'Nhân vật 3D hoạt hình', 
    gender: 'Nữ',
    defaultDescription: 'Nhân vật 3D phong cách hoạt hình dễ thương, năng động, có những biểu cảm cường điệu vui nhộn, phù hợp cho các quảng cáo sản phẩm trẻ em hoặc đồ ăn nhanh.',
    englishDescription: 'A cute, highly stylized 3D animated character (Pixar/Disney style). Highly expressive, dynamic movements with slightly exaggerated, fun facial expressions.'
  },
  {
    id: 'custom_character',
    label: 'Tùy chỉnh nhân vật...',
    gender: 'Nam',
    defaultDescription: '',
    englishDescription: ''
  }
];

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
    englishDescription: 'Handsome Vietnamese man in his late 20s, neat straight jet-black hair, bright expressive dark almond eyes, flawless clear golden skin, strong yet gentle Southeast Asian facial features with a defined clean jawline. Wearing a crisp white chef uniform and tall toque. Confident warm smile, photogenic and charismatic.'
  },
  {
    id: 'lady_consultant',
    label: 'Nữ nhân viên tư vấn sành điệu',
    gender: 'Nữ',
    defaultDescription: 'Nữ nhân viên tư vấn, trang phục chỉnh tề, nụ cười tỏa nắng, nhiệt tình giới thiệu các món đặc sản cho khách.',
    englishDescription: 'Beautiful Vietnamese woman in her mid-20s, glossy straight jet-black hair, large bright dark almond eyes with natural double eyelids, flawless luminous golden skin, delicate feminine Southeast Asian features with soft high cheekbones. Wearing elegant professional attire. Radiant charming smile, naturally photogenic and graceful.'
  },
  {
    id: 'food_reviewer',
    label: 'Food Reviewer năng động',
    gender: 'Nam',
    defaultDescription: 'Một Food Reviewer trẻ trung, cá tính, cách nói chuyện lôi cuốn, hài hước, gương mặt rạng rỡ khi thưởng thức món ăn và luôn tìm tòi những góc quay độc đáo.',
    englishDescription: 'Handsome Vietnamese young man in his early 20s, short stylish straight black hair, bright lively dark eyes, smooth clear golden skin, youthful Southeast Asian features with defined cheekbones and a sharp clean jawline. Wearing a trendy casual outfit. Charismatic bright smile, naturally photogenic and full of energy.'
  },
  {
    id: 'female_vlogger',
    label: 'Bạn trẻ sành ăn (Vlogger)',
    gender: 'Nữ',
    defaultDescription: 'Bạn trẻ Gen Z sành điệu, phong cách năng động, thích khám phá các món ăn xu hướng, biểu cảm tự nhiên và lôi cuốn trước ống kính.',
    englishDescription: 'Beautiful Vietnamese Gen Z woman in her early 20s, long silky straight jet-black hair, large bright almond-shaped dark eyes with natural lashes, flawless luminous golden skin, youthful Southeast Asian features with a soft round face and natural blush. Wearing trendy modern casual fashion. Natural charming smile, effortlessly photogenic and captivating on camera.'
  },
  {
    id: 'friendly_owner',
    label: 'Chủ quán hiếu khách',
    gender: 'Nam',
    defaultDescription: 'Chủ quán trung niên, gương mặt hiền hậu, hay cười, trang phục giảng dị, trực tiếp chuẩn bị món ăn với sự tận tâm như phục vụ người thân trong gia đình.',
    englishDescription: 'Friendly handsome Vietnamese man in his late 30s, short neatly combed black hair, warm bright dark eyes, clear golden skin, approachable photogenic Southeast Asian features with a trustworthy face. Wearing neat casual Vietnamese attire. Broad warm hospitable smile, naturally likable and wholesome.'
  },
  {
    id: 'mom_chef',
    label: 'Mẹ đảm đang nội trợ',
    gender: 'Nữ',
    defaultDescription: 'Người mẹ nội trợ dịu dàng, trang phục ở nhà gọn gàng, khéo léo chế biến những món ăn gia đình đầy yêu thương, gương mặt hạnh phúc.',
    englishDescription: 'Attractive Vietnamese woman in her late 30s, neat black hair tied back elegantly, gentle warm dark eyes, smooth clear golden skin, soft feminine Southeast Asian features with a loving maternal face. Wearing neat comfortable home attire. Bright loving smile, naturally beautiful and nurturing presence.'
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

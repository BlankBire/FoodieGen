/* ─── CONSTANTS ─── */

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
    defaultDescription: 'Nam đầu bếp mặc đồng phục trắng sạch sẽ, mũ cao, tay nghề điêu luyện, gương mặt tập trung nhưng hiền hậu, đam mê nấu nướng và luôn chú trọng đến sự hoàn mỹ trong từng món ăn.'
  },
  { 
    id: 'lady_consultant', 
    label: 'Nữ nhân viên tư vấn sành điệu', 
    gender: 'Nữ',
    defaultDescription: 'Nữ nhân viên tư vấn tại nhà hàng, trang phục chỉnh tề, nụ cười tỏa nắng, am hiểu thực đơn và nhiệt tình gợi ý các món đặc sản cho khách.'
  },
  { 
    id: 'food_reviewer', 
    label: 'Food Reviewer năng động', 
    gender: 'Nam',
    defaultDescription: 'Một Food Reviewer trẻ trung, cá tính, cách nói chuyện lôi cuốn, hài hước, gương mặt rạng rỡ khi thưởng thức món ăn và luôn tìm tòi những góc quay độc đáo.'
  },
  { 
    id: 'female_vlogger', 
    label: 'Bạn trẻ sành ăn (Vlogger)', 
    gender: 'Nữ',
    defaultDescription: 'Bạn trẻ Gen Z sành điệu, phong cách năng động, thích khám phá các món ăn xu hướng, biểu cảm tự nhiên và lôi cuốn trước ống kính.'
  },
  { 
    id: 'friendly_owner', 
    label: 'Chủ quán hiếu khách', 
    gender: 'Nam',
    defaultDescription: 'Chủ quán trung niên, gương mặt hiền hậu, hay cười, trang phục giản dị, trực tiếp chuẩn bị món ăn với sự tận tâm như phục vụ người thân trong gia đình.'
  },
  { 
    id: 'mom_chef', 
    label: 'Mẹ đảm đang nội trợ', 
    gender: 'Nữ',
    defaultDescription: 'Người mẹ nội trợ dịu dàng, trang phục ở nhà gọn gàng, khéo léo chế biến những món ăn gia đình đầy yêu thương, gương mặt hạnh phúc khi thấy con cái ăn ngon.'
  },
  { 
    id: 'ai_character', 
    label: 'Nhân vật 3D hoạt hình', 
    gender: 'Nữ',
    defaultDescription: 'Nhân vật 3D phong cách hoạt hình dễ thương, năng động, có những biểu cảm cường điệu vui nhộn, phù hợp cho các quảng cáo sản phẩm trẻ em hoặc đồ ăn nhanh.'
  }
];

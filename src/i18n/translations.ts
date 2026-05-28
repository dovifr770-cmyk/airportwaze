// ─── Flat Translation Map ─────────────────────────────────────────────────────
// This file extends the existing locale system with a flat-key lookup map.
// Covers all UI strings for: navigation, status labels, home screen,
// smart route, recommendations, connection risk, live stats, alerts, and more.
//
// Supports 4 languages: English (en), Hebrew (he), Arabic (ar), Spanish (es).
// Hebrew and Arabic are RTL — use `isRTL` from `useTranslation` to adjust layout.

export type SupportedLang = 'en' | 'he' | 'ar' | 'es';

// ─── RTL language list ────────────────────────────────────────────────────────
export const RTL_LANGS: SupportedLang[] = ['he', 'ar'];

// ─────────────────────────────────────────────────────────────────────────────
// Translation map — grouped by feature area, flat dot-notation keys.
// ─────────────────────────────────────────────────────────────────────────────
export const TRANSLATIONS: Record<SupportedLang, Record<string, string>> = {

  // ════════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ════════════════════════════════════════════════════════════════════════════
  en: {

    // ── Bottom-tab navigation ───────────────────────────────────────────────
    'nav.findGate':    'Find My Gate',
    'nav.navigate':    'Navigate',
    'nav.airportMap':  'Airport Map',
    'nav.parking':     'Parking',
    'nav.profile':     'Profile',

    // ── Flight status labels ────────────────────────────────────────────────
    'status.onTime':      'On Time',
    'status.delayed':     'Delayed',
    'status.boarding':    'Boarding',
    'status.cancelled':   'Cancelled',
    'status.gateClosed':  'Gate Closed',
    'status.departed':    'Departed',
    'status.arrived':     'Arrived',
    'status.scheduled':   'Scheduled',
    'status.landed':      'Landed',
    'status.diverting':   'Diverting',
    'status.unknown':     'Unknown',

    // ── Home / Dashboard ────────────────────────────────────────────────────
    'home.greetingMorning':   'Good morning',
    'home.greetingAfternoon': 'Good afternoon',
    'home.greetingEvening':   'Good evening',
    'home.greetingNight':     'Good night',
    'home.quickActions':      'Quick Actions',
    'home.yourFlights':       'Your Flights',
    'home.seeAll':            'See all',
    'home.myFlight':          'My Flight',
    'home.crowdInfo':         'Crowd Info',
    'home.lounges':           'Lounges',
    'home.noFlights':         'No flights tracked',
    'home.noFlightsSub':      'Search a flight number to start tracking',
    'home.trackFlight':       'Track Flight',
    'home.airportMap':        'Airport Map',
    'home.findParking':       'Find Parking',
    'home.walkTimer':         'Walk Timer',

    // ── Smart Route / Connection Plan ───────────────────────────────────────
    'route.connectionPlan':    'Connection Plan',
    'route.routeSteps':        'Route Steps',
    'route.yourGate':          'Your Gate',
    'route.securityWait':      'Security Wait',
    'route.terminalTransfer':  'Terminal Transfer',
    'route.walkToGate':        'Walk to Gate',
    'route.stepOf':            'Step {{current}} of {{total}}',
    'route.startNavigation':   'Start Navigation',
    'route.markDone':          'Mark Done',
    'route.finishAtGate':      'Finish — I\'m at the gate!',
    'route.routeComplete':     'Route Complete!',
    'route.routeCompleteMsg':  'You should now be at Gate {{gate}}. Have a great flight!',
    'route.loadingRoute':      'Loading route…',
    'route.crowdAhead':        '{{type}} ahead',
    'route.updateReport':      'Update',

    // ── Recommendations ─────────────────────────────────────────────────────
    'rec.recommendedStop':  'Recommended Stop',
    'rec.loungeAccess':     'Lounge Access',
    'rec.coffeeBreak':      'Coffee Break',
    'rec.grabAndGo':        'Grab & Go',
    'rec.timeToSpare':      'Time to spare',
    'rec.proTip':           'Pro tip',
    'rec.note':             'Note',

    // ── Connection risk levels ───────────────────────────────────────────────
    'risk.critical':        'Critical Connection',
    'risk.tight':           'Tight Connection',
    'risk.comfortable':     'Comfortable',
    'risk.relaxed':         'Relaxed',
    'risk.plentyOfTime':    'Plenty of Time',
    'risk.safe':            'Safe Connection',
    'risk.atRisk':          'At Risk',
    'risk.tooTight':        'Too Tight',
    'risk.impossible':      'Impossible',

    // ── Live stats chips ─────────────────────────────────────────────────────
    'live.security':  'Security',
    'live.wifi':      'Wi-Fi',
    'live.shops':     'Shops',
    'live.gates':     'Gates',
    'live.free':      'Free',
    'live.open':      'Open',
    'live.live':      'Live',
    'live.closed':    'Closed',
    'live.busy':      'Busy',
    'live.quiet':     'Quiet',

    // ── Alert banners / toasts ───────────────────────────────────────────────
    'alert.tightConnection':  'Tight connection',
    'alert.gateChanged':      'Gate changed',
    'alert.boardingSoon':     'Boarding soon',
    'alert.gateClosing':      'Gate closing in {{min}} min',
    'alert.delayedFlight':    'Flight delayed by {{min}} min',
    'alert.newGate':          'New gate: {{gate}}',
    'alert.connectionRisk':   'Connection risk! Only {{minutes}} min to your gate.',

    // ── Tips prefixes ────────────────────────────────────────────────────────
    'tip.proTip':  'Pro tip',
    'tip.note':    'Note',
    'tip.warning': 'Warning',
    'tip.info':    'Info',

    // ── General units / labels ───────────────────────────────────────────────
    'general.minutes':    'minutes',
    'general.minWalk':    'min walk',
    'general.terminal':   'Terminal',
    'general.gate':       'Gate',
    'general.departure':  'Departure',
    'general.arrival':    'Arrival',
    'general.min':        'min',
    'general.hour':       'hr',
    'general.meters':     'm',
    'general.feet':       'ft',
    'general.steps':      'steps',
    'general.distance':   'Distance',
    'general.walkTime':   'Walk time',
    'general.buffer':     'Buffer',
    'general.totalTime':  'Total time',

    // ── Common actions ───────────────────────────────────────────────────────
    'common.loading':   'Loading…',
    'common.error':     'Error',
    'common.cancel':    'Cancel',
    'common.submit':    'Submit',
    'common.back':      'Back',
    'common.done':      'Done',
    'common.refresh':   'Refresh',
    'common.report':    'Report',
    'common.close':     'Close',
    'common.search':    'Search',
    'common.save':      'Save',
    'common.ok':        'OK',
    'common.yes':       'Yes',
    'common.no':        'No',
    'common.seeAll':    'See all',
    'common.tryAgain':  'Try again',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // HEBREW — עברית (RTL)
  // ════════════════════════════════════════════════════════════════════════════
  he: {

    // ── Bottom-tab navigation ───────────────────────────────────────────────
    'nav.findGate':    'מצא את השער שלי',
    'nav.navigate':    'ניווט',
    'nav.airportMap':  'מפת שדה תעופה',
    'nav.parking':     'חניה',
    'nav.profile':     'פרופיל',

    // ── Flight status labels ────────────────────────────────────────────────
    'status.onTime':      'בזמן',
    'status.delayed':     'מאוחר',
    'status.boarding':    'עלייה למטוס',
    'status.cancelled':   'מבוטל',
    'status.gateClosed':  'השער נסגר',
    'status.departed':    'המריא',
    'status.arrived':     'נחת',
    'status.scheduled':   'מתוכנן',
    'status.landed':      'נחת',
    'status.diverting':   'הועבר לנתיב חלופי',
    'status.unknown':     'לא ידוע',

    // ── Home / Dashboard ────────────────────────────────────────────────────
    'home.greetingMorning':   'בוקר טוב',
    'home.greetingAfternoon': 'צהריים טובים',
    'home.greetingEvening':   'ערב טוב',
    'home.greetingNight':     'לילה טוב',
    'home.quickActions':      'פעולות מהירות',
    'home.yourFlights':       'הטיסות שלי',
    'home.seeAll':            'הצג הכל',
    'home.myFlight':          'הטיסה שלי',
    'home.crowdInfo':         'מידע על עומס',
    'home.lounges':           'טרקלינים',
    'home.noFlights':         'אין טיסות במעקב',
    'home.noFlightsSub':      'חפש מספר טיסה כדי להתחיל מעקב',
    'home.trackFlight':       'מעקב טיסה',
    'home.airportMap':        'מפת שדה תעופה',
    'home.findParking':       'חניה',
    'home.walkTimer':         'טיימר הליכה',

    // ── Smart Route / Connection Plan ───────────────────────────────────────
    'route.connectionPlan':    'תכנית חיבור',
    'route.routeSteps':        'שלבי מסלול',
    'route.yourGate':          'השער שלך',
    'route.securityWait':      'המתנה בביטחון',
    'route.terminalTransfer':  'מעבר בין טרמינלים',
    'route.walkToGate':        'הליכה לשער',
    'route.stepOf':            'שלב {{current}} מתוך {{total}}',
    'route.startNavigation':   'התחל ניווט',
    'route.markDone':          'סמן כבוצע',
    'route.finishAtGate':      'סיום — הגעתי לשער!',
    'route.routeComplete':     'המסלול הושלם!',
    'route.routeCompleteMsg':  'כעת אתה אמור להיות בשער {{gate}}. טיסה נעימה!',
    'route.loadingRoute':      'טוען מסלול…',
    'route.crowdAhead':        '{{type}} לפניך',
    'route.updateReport':      'עדכון',

    // ── Recommendations ─────────────────────────────────────────────────────
    'rec.recommendedStop':  'עצירה מומלצת',
    'rec.loungeAccess':     'כניסה לטרקלין',
    'rec.coffeeBreak':      'הפסקת קפה',
    'rec.grabAndGo':        'מהיר וטעים',
    'rec.timeToSpare':      'יש לך זמן פנוי',
    'rec.proTip':           'טיפ מקצועי',
    'rec.note':             'הערה',

    // ── Connection risk levels ───────────────────────────────────────────────
    'risk.critical':        'חיבור קריטי',
    'risk.tight':           'חיבור צפוף',
    'risk.comfortable':     'נוח',
    'risk.relaxed':         'רגוע',
    'risk.plentyOfTime':    'הרבה זמן',
    'risk.safe':            'חיבור בטוח',
    'risk.atRisk':          'בסיכון',
    'risk.tooTight':        'צפוף מדי',
    'risk.impossible':      'בלתי אפשרי',

    // ── Live stats chips ─────────────────────────────────────────────────────
    'live.security':  'ביטחון',
    'live.wifi':      'Wi-Fi',
    'live.shops':     'חנויות',
    'live.gates':     'שערים',
    'live.free':      'פנוי',
    'live.open':      'פתוח',
    'live.live':      'חי',
    'live.closed':    'סגור',
    'live.busy':      'עמוס',
    'live.quiet':     'שקט',

    // ── Alert banners / toasts ───────────────────────────────────────────────
    'alert.tightConnection':  'חיבור צפוף',
    'alert.gateChanged':      'השער שונה',
    'alert.boardingSoon':     'עלייה למטוס בקרוב',
    'alert.gateClosing':      'השער נסגר בעוד {{min}} דק׳',
    'alert.delayedFlight':    'טיסה מאוחרת ב-{{min}} דק׳',
    'alert.newGate':          'שער חדש: {{gate}}',
    'alert.connectionRisk':   'סיכון לחיבור! רק {{minutes}} דק׳ לשער שלך.',

    // ── Tips prefixes ────────────────────────────────────────────────────────
    'tip.proTip':  'טיפ מקצועי',
    'tip.note':    'הערה',
    'tip.warning': 'אזהרה',
    'tip.info':    'מידע',

    // ── General units / labels ───────────────────────────────────────────────
    'general.minutes':    'דקות',
    'general.minWalk':    'דק׳ הליכה',
    'general.terminal':   'טרמינל',
    'general.gate':       'שער',
    'general.departure':  'יציאה',
    'general.arrival':    'הגעה',
    'general.min':        'דק׳',
    'general.hour':       'ש׳',
    'general.meters':     'מ׳',
    'general.feet':       'רגל',
    'general.steps':      'צעדים',
    'general.distance':   'מרחק',
    'general.walkTime':   'זמן הליכה',
    'general.buffer':     'מאגר',
    'general.totalTime':  'זמן כולל',

    // ── Common actions ───────────────────────────────────────────────────────
    'common.loading':   'טוען…',
    'common.error':     'שגיאה',
    'common.cancel':    'ביטול',
    'common.submit':    'שליחה',
    'common.back':      'חזרה',
    'common.done':      'סיום',
    'common.refresh':   'רענון',
    'common.report':    'דיווח',
    'common.close':     'סגירה',
    'common.search':    'חיפוש',
    'common.save':      'שמירה',
    'common.ok':        'אישור',
    'common.yes':       'כן',
    'common.no':        'לא',
    'common.seeAll':    'הצג הכל',
    'common.tryAgain':  'נסה שוב',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ARABIC — العربية (RTL)
  // ════════════════════════════════════════════════════════════════════════════
  ar: {

    // ── Bottom-tab navigation ───────────────────────────────────────────────
    'nav.findGate':    'ابحث عن بوابتي',
    'nav.navigate':    'التنقل',
    'nav.airportMap':  'خريطة المطار',
    'nav.parking':     'موقف السيارات',
    'nav.profile':     'الملف الشخصي',

    // ── Flight status labels ────────────────────────────────────────────────
    'status.onTime':      'في الموعد',
    'status.delayed':     'متأخر',
    'status.boarding':    'الصعود إلى الطائرة',
    'status.cancelled':   'ملغي',
    'status.gateClosed':  'البوابة مغلقة',
    'status.departed':    'غادر',
    'status.arrived':     'وصل',
    'status.scheduled':   'مجدول',
    'status.landed':      'هبط',
    'status.diverting':   'تحويل المسار',
    'status.unknown':     'غير معروف',

    // ── Home / Dashboard ────────────────────────────────────────────────────
    'home.greetingMorning':   'صباح الخير',
    'home.greetingAfternoon': 'مساء الخير',
    'home.greetingEvening':   'مساء النور',
    'home.greetingNight':     'تصبح على خير',
    'home.quickActions':      'إجراءات سريعة',
    'home.yourFlights':       'رحلاتك',
    'home.seeAll':            'عرض الكل',
    'home.myFlight':          'رحلتي',
    'home.crowdInfo':         'معلومات الازدحام',
    'home.lounges':           'صالات الانتظار',
    'home.noFlights':         'لا توجد رحلات مُتتبَّعة',
    'home.noFlightsSub':      'ابحث عن رقم رحلة لبدء التتبع',
    'home.trackFlight':       'تتبع الرحلة',
    'home.airportMap':        'خريطة المطار',
    'home.findParking':       'البحث عن موقف',
    'home.walkTimer':         'مؤقت المشي',

    // ── Smart Route / Connection Plan ───────────────────────────────────────
    'route.connectionPlan':    'خطة الربط',
    'route.routeSteps':        'خطوات المسار',
    'route.yourGate':          'بوابتك',
    'route.securityWait':      'وقت انتظار الأمن',
    'route.terminalTransfer':  'النقل بين الصاليات',
    'route.walkToGate':        'المشي إلى البوابة',
    'route.stepOf':            'خطوة {{current}} من {{total}}',
    'route.startNavigation':   'ابدأ التنقل',
    'route.markDone':          'تحديد كمكتمل',
    'route.finishAtGate':      'انتهاء — وصلت إلى البوابة!',
    'route.routeComplete':     'اكتمل المسار!',
    'route.routeCompleteMsg':  'يجب أن تكون الآن عند البوابة {{gate}}. رحلة طيبة!',
    'route.loadingRoute':      'جارٍ تحميل المسار…',
    'route.crowdAhead':        '{{type}} أمامك',
    'route.updateReport':      'تحديث',

    // ── Recommendations ─────────────────────────────────────────────────────
    'rec.recommendedStop':  'توقف موصى به',
    'rec.loungeAccess':     'الدخول إلى الصالة',
    'rec.coffeeBreak':      'استراحة قهوة',
    'rec.grabAndGo':        'سريع وعملي',
    'rec.timeToSpare':      'لديك وقت',
    'rec.proTip':           'نصيحة احترافية',
    'rec.note':             'ملاحظة',

    // ── Connection risk levels ───────────────────────────────────────────────
    'risk.critical':        'ربط حرج',
    'risk.tight':           'ربط ضيق',
    'risk.comfortable':     'مريح',
    'risk.relaxed':         'مسترخٍ',
    'risk.plentyOfTime':    'وقت كافٍ',
    'risk.safe':            'ربط آمن',
    'risk.atRisk':          'في خطر',
    'risk.tooTight':        'ضيق جداً',
    'risk.impossible':      'مستحيل',

    // ── Live stats chips ─────────────────────────────────────────────────────
    'live.security':  'الأمن',
    'live.wifi':      'واي فاي',
    'live.shops':     'المتاجر',
    'live.gates':     'البوابات',
    'live.free':      'مجاني',
    'live.open':      'مفتوح',
    'live.live':      'مباشر',
    'live.closed':    'مغلق',
    'live.busy':      'مزدحم',
    'live.quiet':     'هادئ',

    // ── Alert banners / toasts ───────────────────────────────────────────────
    'alert.tightConnection':  'ربط ضيق',
    'alert.gateChanged':      'تغييرت البوابة',
    'alert.boardingSoon':     'الصعود قريباً',
    'alert.gateClosing':      'تغلق البوابة خلال {{min}} دقيقة',
    'alert.delayedFlight':    'تأخير الرحلة بمقدار {{min}} دقيقة',
    'alert.newGate':          'البوابة الجديدة: {{gate}}',
    'alert.connectionRisk':   'خطر الربط! {{minutes}} دقيقة فقط للوصول إلى بوابتك.',

    // ── Tips prefixes ────────────────────────────────────────────────────────
    'tip.proTip':  'نصيحة احترافية',
    'tip.note':    'ملاحظة',
    'tip.warning': 'تحذير',
    'tip.info':    'معلومة',

    // ── General units / labels ───────────────────────────────────────────────
    'general.minutes':    'دقائق',
    'general.minWalk':    'دقيقة مشياً',
    'general.terminal':   'الصالة',
    'general.gate':       'البوابة',
    'general.departure':  'المغادرة',
    'general.arrival':    'الوصول',
    'general.min':        'د',
    'general.hour':       'س',
    'general.meters':     'م',
    'general.feet':       'قدم',
    'general.steps':      'خطوات',
    'general.distance':   'المسافة',
    'general.walkTime':   'وقت المشي',
    'general.buffer':     'وقت احتياطي',
    'general.totalTime':  'الوقت الإجمالي',

    // ── Common actions ───────────────────────────────────────────────────────
    'common.loading':   'جارٍ التحميل…',
    'common.error':     'خطأ',
    'common.cancel':    'إلغاء',
    'common.submit':    'إرسال',
    'common.back':      'رجوع',
    'common.done':      'تم',
    'common.refresh':   'تحديث',
    'common.report':    'تقرير',
    'common.close':     'إغلاق',
    'common.search':    'بحث',
    'common.save':      'حفظ',
    'common.ok':        'موافق',
    'common.yes':       'نعم',
    'common.no':        'لا',
    'common.seeAll':    'عرض الكل',
    'common.tryAgain':  'حاول مجدداً',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SPANISH — Español
  // ════════════════════════════════════════════════════════════════════════════
  es: {

    // ── Bottom-tab navigation ───────────────────────────────────────────────
    'nav.findGate':    'Encontrar Mi Puerta',
    'nav.navigate':    'Navegar',
    'nav.airportMap':  'Mapa del Aeropuerto',
    'nav.parking':     'Estacionamiento',
    'nav.profile':     'Perfil',

    // ── Flight status labels ────────────────────────────────────────────────
    'status.onTime':      'A Tiempo',
    'status.delayed':     'Retrasado',
    'status.boarding':    'Embarcando',
    'status.cancelled':   'Cancelado',
    'status.gateClosed':  'Puerta Cerrada',
    'status.departed':    'Despegó',
    'status.arrived':     'Llegó',
    'status.scheduled':   'Programado',
    'status.landed':      'Aterrizó',
    'status.diverting':   'Desviando',
    'status.unknown':     'Desconocido',

    // ── Home / Dashboard ────────────────────────────────────────────────────
    'home.greetingMorning':   'Buenos días',
    'home.greetingAfternoon': 'Buenas tardes',
    'home.greetingEvening':   'Buenas noches',
    'home.greetingNight':     'Buenas noches',
    'home.quickActions':      'Acciones Rápidas',
    'home.yourFlights':       'Tus Vuelos',
    'home.seeAll':            'Ver todo',
    'home.myFlight':          'Mi Vuelo',
    'home.crowdInfo':         'Info de Afluencia',
    'home.lounges':           'Salas VIP',
    'home.noFlights':         'Sin vuelos en seguimiento',
    'home.noFlightsSub':      'Busca un número de vuelo para comenzar',
    'home.trackFlight':       'Seguir Vuelo',
    'home.airportMap':        'Mapa del Aeropuerto',
    'home.findParking':       'Buscar Estacionamiento',
    'home.walkTimer':         'Temporizador de Caminata',

    // ── Smart Route / Connection Plan ───────────────────────────────────────
    'route.connectionPlan':    'Plan de Conexión',
    'route.routeSteps':        'Pasos de Ruta',
    'route.yourGate':          'Tu Puerta',
    'route.securityWait':      'Espera en Seguridad',
    'route.terminalTransfer':  'Traslado de Terminal',
    'route.walkToGate':        'Caminar a la Puerta',
    'route.stepOf':            'Paso {{current}} de {{total}}',
    'route.startNavigation':   'Iniciar Navegación',
    'route.markDone':          'Marcar como Hecho',
    'route.finishAtGate':      'Finalizar — ¡Estoy en la puerta!',
    'route.routeComplete':     '¡Ruta Completada!',
    'route.routeCompleteMsg':  'Deberías estar en la Puerta {{gate}}. ¡Buen vuelo!',
    'route.loadingRoute':      'Cargando ruta…',
    'route.crowdAhead':        '{{type}} adelante',
    'route.updateReport':      'Actualizar',

    // ── Recommendations ─────────────────────────────────────────────────────
    'rec.recommendedStop':  'Parada Recomendada',
    'rec.loungeAccess':     'Acceso a Sala VIP',
    'rec.coffeeBreak':      'Pausa para Café',
    'rec.grabAndGo':        'Rápido y Listo',
    'rec.timeToSpare':      'Tienes tiempo de sobra',
    'rec.proTip':           'Consejo pro',
    'rec.note':             'Nota',

    // ── Connection risk levels ───────────────────────────────────────────────
    'risk.critical':        'Conexión Crítica',
    'risk.tight':           'Conexión Ajustada',
    'risk.comfortable':     'Cómodo',
    'risk.relaxed':         'Relajado',
    'risk.plentyOfTime':    'Tiempo de Sobra',
    'risk.safe':            'Conexión Segura',
    'risk.atRisk':          'En Riesgo',
    'risk.tooTight':        'Demasiado Ajustada',
    'risk.impossible':      'Imposible',

    // ── Live stats chips ─────────────────────────────────────────────────────
    'live.security':  'Seguridad',
    'live.wifi':      'Wi-Fi',
    'live.shops':     'Tiendas',
    'live.gates':     'Puertas',
    'live.free':      'Gratis',
    'live.open':      'Abierto',
    'live.live':      'En Vivo',
    'live.closed':    'Cerrado',
    'live.busy':      'Concurrido',
    'live.quiet':     'Tranquilo',

    // ── Alert banners / toasts ───────────────────────────────────────────────
    'alert.tightConnection':  'Conexión ajustada',
    'alert.gateChanged':      'Puerta cambiada',
    'alert.boardingSoon':     'Embarque próximo',
    'alert.gateClosing':      'La puerta cierra en {{min}} min',
    'alert.delayedFlight':    'Vuelo retrasado {{min}} min',
    'alert.newGate':          'Nueva puerta: {{gate}}',
    'alert.connectionRisk':   '¡Riesgo de conexión! Solo {{minutes}} min para tu puerta.',

    // ── Tips prefixes ────────────────────────────────────────────────────────
    'tip.proTip':  'Consejo pro',
    'tip.note':    'Nota',
    'tip.warning': 'Advertencia',
    'tip.info':    'Info',

    // ── General units / labels ───────────────────────────────────────────────
    'general.minutes':    'minutos',
    'general.minWalk':    'min caminando',
    'general.terminal':   'Terminal',
    'general.gate':       'Puerta',
    'general.departure':  'Salida',
    'general.arrival':    'Llegada',
    'general.min':        'min',
    'general.hour':       'h',
    'general.meters':     'm',
    'general.feet':       'pies',
    'general.steps':      'pasos',
    'general.distance':   'Distancia',
    'general.walkTime':   'Tiempo de caminata',
    'general.buffer':     'Margen',
    'general.totalTime':  'Tiempo total',

    // ── Common actions ───────────────────────────────────────────────────────
    'common.loading':   'Cargando…',
    'common.error':     'Error',
    'common.cancel':    'Cancelar',
    'common.submit':    'Enviar',
    'common.back':      'Atrás',
    'common.done':      'Listo',
    'common.refresh':   'Actualizar',
    'common.report':    'Reportar',
    'common.close':     'Cerrar',
    'common.search':    'Buscar',
    'common.save':      'Guardar',
    'common.ok':        'Aceptar',
    'common.yes':       'Sí',
    'common.no':        'No',
    'common.seeAll':    'Ver todo',
    'common.tryAgain':  'Intentar de nuevo',
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Lightweight translation hook — no external i18n library required.
 *
 * @param lang - Active language code (defaults to 'en')
 * @returns
 *   - `t(key, fallback?)` — resolve a translation key, falling back to English
 *     then to the raw key if nothing matches
 *   - `isRTL` — true for Hebrew and Arabic
 *   - `lang` — the active language code
 *
 * @example
 * const { t, isRTL } = useTranslation('he');
 * t('nav.findGate') // → 'מצא את השער שלי'
 * isRTL             // → true
 */
export function useTranslation(lang: SupportedLang = 'en') {
  return {
    t: (key: string, fallback?: string): string =>
      TRANSLATIONS[lang]?.[key] ??
      TRANSLATIONS['en']?.[key] ??
      fallback ??
      key,
    isRTL: RTL_LANGS.includes(lang),
    lang,
  };
}

/**
 * Standalone translate helper (non-hook version, for use outside React).
 *
 * @example
 * translate('he', 'status.onTime') // → 'בזמן'
 */
export function translate(
  lang: SupportedLang,
  key: string,
  fallback?: string,
): string {
  return (
    TRANSLATIONS[lang]?.[key] ??
    TRANSLATIONS['en']?.[key] ??
    fallback ??
    key
  );
}

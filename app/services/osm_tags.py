import re

TagPairs = tuple[tuple[str, str], ...]

TAG_MAPPINGS: dict[str, TagPairs] = {
    "dentist": (("amenity", "dentist"), ("healthcare", "dentist")),
    "restaurant": (("amenity", "restaurant"),),
    "cafe": (("amenity", "cafe"),),
    "coffee shop": (("amenity", "cafe"),),
    "bar": (("amenity", "bar"),),
    "lawyer": (("office", "lawyer"),),
    "attorney": (("office", "lawyer"),),
    "notary": (("office", "notary"),),
    "accountant": (("office", "accountant"),),
    "insurance": (("office", "insurance"),),
    "bakery": (("shop", "bakery"),),
    "butcher": (("shop", "butcher"),),
    "florist": (("shop", "florist"),),
    "hairdresser": (("shop", "hairdresser"),),
    "barber": (("shop", "hairdresser"),),
    "beauty salon": (("shop", "beauty"),),
    "tattoo": (("shop", "tattoo"),),
    "optician": (("shop", "optician"),),
    "jeweler": (("shop", "jewelry"),),
    "electrician": (("craft", "electrician"),),
    "plumber": (("craft", "plumber"),),
    "carpenter": (("craft", "carpenter"),),
    "painter": (("craft", "painter"),),
    "photographer": (("craft", "photographer"), ("shop", "photo")),
    "architect": (("office", "architect"),),
    "real estate": (("office", "estate_agent"),),
    "real estate agent": (("office", "estate_agent"),),
    "real estate agency": (("office", "estate_agent"),),
    "estate agent": (("office", "estate_agent"),),
    "pharmacy": (("amenity", "pharmacy"), ("healthcare", "pharmacy")),
    "doctor": (("amenity", "doctors"), ("healthcare", "doctor")),
    "physiotherapist": (("healthcare", "physiotherapist"),),
    "hospital": (("amenity", "hospital"), ("healthcare", "hospital")),
    "hotel": (("tourism", "hotel"),),
    "hostel": (("tourism", "hostel"),),
    "guest house": (("tourism", "guest_house"),),
    "gym": (("leisure", "fitness_centre"),),
    "fitness": (("leisure", "fitness_centre"),),
    "fitness studio": (("leisure", "fitness_centre"),),
    "car repair": (("shop", "car_repair"),),
    "car mechanic": (("shop", "car_repair"),),
    "auto repair": (("shop", "car_repair"),),
    "car dealer": (("shop", "car"),),
    "car wash": (("amenity", "car_wash"),),
    "driving school": (("amenity", "driving_school"),),
    "veterinarian": (("amenity", "veterinary"),),
    "vet": (("amenity", "veterinary"),),
    "kindergarten": (("amenity", "kindergarten"),),
    "travel agency": (("shop", "travel_agency"),),
    "supermarket": (("shop", "supermarket"),),
    "web design": (("office", "it"),),
    "it company": (("office", "it"),),
    "software company": (("office", "it"),),
    "marketing agency": (("office", "advertising_agency"),),
    "advertising agency": (("office", "advertising_agency"),),
}

CONCEPT_ALIASES: dict[str, tuple[str, ...]] = {
    "dentist": ("zahnarzt", "zahnarztpraxis", "стоматолог", "стоматология", "зубной врач", "дантист", "dentista", "odontólogo", "diş hekimi", "dişçi"),
    "restaurant": ("ресторан", "restaurante", "restoran", "lokanta"),
    "cafe": ("café", "kaffee", "кафе", "кофейня", "cafetería", "kafe", "kahve"),
    "bar": ("kneipe", "бар"),
    "lawyer": ("anwalt", "rechtsanwalt", "адвокат", "юрист", "abogado", "avukat"),
    "notary": ("notar", "нотариус", "notario", "noter"),
    "accountant": ("buchhalter", "steuerberater", "бухгалтер", "contador", "contable", "muhasebeci"),
    "insurance": ("versicherung", "страхование", "страховая", "seguros", "seguro", "sigorta"),
    "bakery": ("bäckerei", "пекарня", "булочная", "panadería", "fırın", "ekmek fırını"),
    "butcher": ("metzgerei", "fleischerei", "мясная лавка", "мясник", "carnicería", "kasap"),
    "florist": ("blumenladen", "цветы", "цветочный магазин", "флорист", "floristería", "florería", "çiçekçi"),
    "hairdresser": ("friseur", "парикмахерская", "peluquería", "kuaför", "berber", "barbier", "барбершоп"),
    "beauty salon": ("kosmetikstudio", "schönheitssalon", "салон красоты", "косметология", "salón de belleza", "estética", "güzellik salonu"),
    "tattoo": ("tätowierung", "тату", "тату салон", "татуировка", "tatuajes", "tatuaje", "dövme"),
    "optician": ("optiker", "оптика", "óptica", "gözlükçü", "optik"),
    "jeweler": ("juwelier", "ювелирный", "ювелир", "ювелирный магазин", "joyería", "kuyumcu"),
    "electrician": ("elektriker", "электрик", "electricista", "elektrikçi"),
    "plumber": ("klempner", "installateur", "сантехник", "fontanero", "plomero", "tesisatçı", "su tesisatçısı"),
    "carpenter": ("tischler", "schreiner", "плотник", "столяр", "carpintero", "marangoz"),
    "painter": ("maler", "маляр", "pintor", "boyacı"),
    "photographer": ("fotograf", "фотограф", "fotógrafo", "fotoğrafçı"),
    "architect": ("architekt", "архитектор", "arquitecto", "mimar"),
    "real estate": ("immobilien", "immobilienmakler", "недвижимость", "риелтор", "агентство недвижимости", "inmobiliaria", "bienes raíces", "emlak", "emlakçı"),
    "pharmacy": ("apotheke", "аптека", "farmacia", "eczane"),
    "doctor": ("arzt", "arztpraxis", "врач", "доктор", "поликлиника", "médico", "hekim"),
    "physiotherapist": ("physiotherapie", "physiotherapeut", "физиотерапевт", "fisioterapeuta", "fisioterapia", "fizyoterapist"),
    "hospital": ("krankenhaus", "klinik", "больница", "госпиталь", "hastane"),
    "hotel": ("отель", "гостиница", "otel"),
    "hostel": ("jugendherberge", "хостел", "hostal", "albergue", "pansiyon"),
    "guest house": ("pension", "gästehaus", "гостевой дом", "casa de huéspedes", "pensión", "misafirhane", "konukevi"),
    "gym": ("fitnessstudio", "спортзал", "тренажёрный зал", "тренажерный зал", "фитнес", "фитнес клуб", "gimnasio", "spor salonu"),
    "car repair": ("autowerkstatt", "kfz-werkstatt", "werkstatt", "автосервис", "автомастерская", "сто", "ремонт авто", "taller mecánico", "taller", "oto tamir", "oto tamirci", "tamirhane"),
    "car dealer": ("autohaus", "автосалон", "автодилер", "concesionario", "oto galeri"),
    "car wash": ("autowäsche", "waschanlage", "автомойка", "lavado de autos", "lavadero", "oto yıkama"),
    "driving school": ("fahrschule", "автошкола", "autoescuela", "sürücü kursu"),
    "veterinarian": ("tierarzt", "ветеринар", "ветклиника", "ветеринарная клиника", "veterinario", "veteriner"),
    "kindergarten": ("детский сад", "guardería", "jardín de infancia", "anaokulu", "kreş"),
    "travel agency": ("reisebüro", "турагентство", "туристическое агентство", "agencia de viajes", "seyahat acentesi"),
    "supermarket": ("supermarkt", "супермаркет", "supermercado", "süpermarket"),
    "marketing agency": ("werbeagentur", "marketingagentur", "рекламное агентство", "маркетинговое агентство", "agencia de marketing", "agencia de publicidad", "reklam ajansı"),
    "web design": ("it-firma", "softwarefirma", "веб студия", "разработка сайтов", "diseño web", "yazılım firması", "web tasarım"),
}

_ALIAS_TO_CANONICAL: dict[str, str] = {
    alias: canonical
    for canonical, aliases in CONCEPT_ALIASES.items()
    for alias in aliases
}


def normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", query.strip().lower())


def tags_for_query(query: str) -> TagPairs | None:
    normalized = normalize_query(query)
    if normalized in TAG_MAPPINGS:
        return TAG_MAPPINGS[normalized]
    canonical = _ALIAS_TO_CANONICAL.get(normalized)
    if canonical is not None:
        return TAG_MAPPINGS[canonical]
    if normalized.endswith("s") and normalized[:-1] in TAG_MAPPINGS:
        return TAG_MAPPINGS[normalized[:-1]]
    return None

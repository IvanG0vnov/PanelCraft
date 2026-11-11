/* PanelCraft — i18n */
(function () {
  "use strict";

  const DICT = {
    ru: {
      app: {
        tagline: "мебель · раскрой",
        workspace: "Рабочее пространство",
        workshop: "Мастерская",
        autosave: "Автосохранение включено",
        name: "PanelCraft",
        version: "Версия 1.0",
      },
      nav: { designer: "Конструктор", parts: "Детали", cutting: "Раскрой", materials: "Материалы", project: "Проект" },
      page: {
        designer: { title: "Конструктор", subtitle: "Соберите корпусную мебель из параметрических шаблонов — спецификация деталей пересчитается автоматически." },
        parts: { title: "Детали проекта", subtitle: "Полная спецификация: размеры, материалы, кромка и направление текстуры." },
        cutting: { title: "Карты раскроя", subtitle: "Оптимальное размещение деталей на листах с учётом пропила, отступов и текстуры." },
        materials: { title: "Материалы", subtitle: "Листовые материалы, форматы, цены и настройки для расчёта раскроя." },
        project: { title: "Проект", subtitle: "Общие настройки, данные и резервные копии вашего проекта." },
      },
      common: {
        add: "Добавить", edit: "Изменить", delete: "Удалить", duplicate: "Дублировать", save: "Сохранить",
        cancel: "Отмена", close: "Закрыть", apply: "Применить", export: "Экспорт", import: "Импорт",
        print: "Печать", search: "Поиск", all: "Все", reset: "Сбросить", create: "Создать", open: "Открыть",
        total: "Итого", actions: "Действия", name: "Название", quantity: "Кол-во", material: "Материал",
        color: "Цвет", price: "Цена", width: "Ширина", height: "Высота", depth: "Глубина", length: "Длина",
        thickness: "Толщина", area: "Площадь", none: "Нет", optional: "необязательно", used: "Используется",
        custom: "Своя деталь", generated: "Изделие", confirmTitle: "Подтвердите действие", back: "Назад",
        done: "Готово", more: "Подробнее", item: "изделие", items: "изделия", parts: "детали", sheets: "листы",
        pieces: "шт.", mm: "мм", m2: "м²", pcs: "шт.", unitPrice: "Цена", perSheet: "за лист",
        yes: "Да", no: "Нет", cancelShort: "Отмена", unnamed: "Без названия", copySuffix: "копия",
        closeEsc: "Esc — закрыть", noneSelected: "Не выбрано", choose: "Выбрать",
      },
      plurals: {
        item: ["изделие", "изделия", "изделий"],
        part: ["деталь", "детали", "деталей"],
        sheet: ["лист", "листа", "листов"],
        material: ["материал", "материала", "материалов"],
        offcut: ["остаток", "остатка", "остатков"],
        row: ["позиция", "позиции", "позиций"],
      },
      templates: {
        cabinet: "Корпусный шкаф", chest: "Комод", rack: "Стеллаж",
        cabinetDesc: "Шкаф, тумба, пенал", chestDesc: "Ящики с фасадами", rackDesc: "Открытые полки",
        choose: "Новое изделие", chooseHint: "Выберите параметрический шаблон — размеры и состав можно изменить.",
      },
      params: {
        width: "Ширина", height: "Высота", depth: "Глубина", shelves: "Полки", doors: "Двери",
        doorSections: "Секции", drawers: "Ящики", plinth: "Цоколь", plinthHeight: "Высота цоколя", doorGap: "Зазор фасадов",
        backPanel: "Задняя стенка", bodyMaterial: "Материал корпуса", facadeMaterial: "Материал фасадов",
        backMaterial: "Материал задней стенки", dimensions: "Габариты", construction: "Конструкция",
        facades: "Фасады и наполнение", allMm: "Все размеры в миллиметрах", bodyHint: "Толщина корпуса берётся из материала.",
        backThicknessHint: "Для задней стенки используйте тонкий материал, например ХДФ 4 мм.",
        doorGapHint: "Щель между фасадами и краем корпуса.",
        doorSectionsHint: "Каждая дверь делится по высоте на равные секции.",
        noFacadeMaterial: "Фасады не выбраны", edgeAll: "по периметру",
        shelvesHint: "Внутренние полки", drawersHint: "Выдвижные ящики с дном",
      },
      designer: {
        itemsTitle: "Изделия", addItem: "Добавить изделие", addItemHint: "Шаблон",
        noItemsTitle: "В проекте пока нет изделий", noItemsHint: "Создайте первое изделие из шаблона — детали сразу появятся в спецификации и раскрое.",
        createFirst: "Создать изделие", namePlaceholder: "Название изделия",
        itemName: "Название изделия", deleteItem: "Удалить изделие",
        deleteConfirm: "Удалить изделие «{name}»? Все его детали исчезнут из спецификации и раскроя.",
        added: "Изделие добавлено", duplicated: "Изделие продублировано", deleted: "Изделие удалено",
        front: "Фасад", layout: "Схема", iso: "3D", previewTitle: "Предпросмотр", previewSub: "Схема без масштаба",
        generatedTitle: "Детали изделия", generatedSub: "{rows} · {parts}",
        openParts: "Все детали проекта", emptyParts: "У изделия пока нет деталей.",
        statDims: "Габариты", statArea: "Площадь деталей", statParts: "Деталей",
        noFacades: "Без фасадов", withFacades: "{n} фасада", backType: "Вкладная",
        previewNote: "Фасады показаны полупрозрачными", itemToolbarHint: "Параметрическая модель",
        grainLocked: "Текстура вдоль длины",
        deleteTitle: "Удаление изделия",
        quantityRows: "Позиций",
        shelvesCount: "Полок: {n}", doorsCount: "Двери: {n}", drawersCount: "Ящики: {n}",
        layoutNote: "Схема: внутренние полки и фасады",
        layoutShelfHint: "Нажмите на полку в схеме, чтобы убрать или вернуть её",
        resizeWidth: "Изменить ширину", resizeHeight: "Изменить высоту",
        resizeHint: "Тяните за маркеры на схеме, чтобы изменить размеры",
        tip: "Меняйте размеры ползунками — детали и раскрой пересчитываются мгновенно.",
        templateBadge: "Шаблон",
      },
      parts: {
        addPart: "Добавить деталь", addPartShort: "Своя деталь",
        newPartTitle: "Новая деталь", editPartTitle: "Редактировать деталь",
        newPartHint: "Деталь не связана с изделием и попадёт в раскрой как есть.",
        partName: "Название детали", namePlaceholder: "Например, полка угловая",
        length: "Длина", width: "Ширина", qty: "Количество", material: "Материал",
        grain: "Направление текстуры", grainLock: "Фиксировать вдоль длины",
        grainHint: "Поворот детали при раскрое будет запрещён.",
        edges: "Кромка", edgesHint: "Отметьте окромкованные стороны.",
        edgeTop: "Верх", edgeBottom: "Низ", edgeLeft: "Левая", edgeRight: "Правая",
        searchPlaceholder: "Поиск по названию…", allMaterials: "Все материалы",
        statRows: "Позиций", statParts: "Всего деталей", statArea: "Площадь деталей", statBanding: "Кромка",
        tablePart: "Деталь", tableMaterial: "Материал", tableSize: "Размер, мм", tableQty: "Кол-во",
        tableEdges: "Кромка", tableGrain: "Текстура", tableSource: "Источник",
        sourceItem: "Изделие: {name}", sourceCustom: "Своя деталь", sourceGenerated: "Параметрическая",
        linkedTip: "Деталь рассчитывается из изделия. Измените параметры в конструкторе.",
        goToItem: "Открыть в конструкторе", deleteConfirm: "Удалить деталь «{name}» из проекта?",
        saved: "Деталь сохранена", deleted: "Деталь удалена", errorName: "Укажите название детали.",
        errorSize: "Длина и ширина должны быть больше нуля.", errorQty: "Количество — от 1 до 999.",
        errorMaterial: "Выберите материал.",
        emptyTitle: "Деталей пока нет", emptyHint: "Добавьте изделие в конструкторе или создайте отдельную деталь.",
        edgeNone: "Без кромки", grainFree: "Свободно", grainLockedShort: "Вдоль длины",
        rowsShown: "Показано {shown} из {total}",
        lockedNotice: "Детали изделий нельзя редактировать напрямую — измените параметры изделия.",
        edgeMeters: "{n} п. м.", totalParts: "{n}",
        searchEmptyTitle: "Ничего не найдено", searchEmptyHint: "Измените запрос или фильтр материала.",
        customBadge: "Своя", allParts: "Все детали",
      },
      cutting: {
        paramsTitle: "Параметры раскроя", paramsSub: "Пропил, отступы и стратегия размещения",
        kerf: "Пропил", kerfHint: "Ширина диска / фрезы",
        trim: "Обрезка листа", trimHint: "Отступ по периметру листа",
        rotate: "Поворачивать детали", rotateHint: "Кроме деталей с фиксированной текстурой",
        algorithm: "Алгоритм", algorithmMR: "Максимальная плотность", algorithmMRHint: "Свободное размещение, ЧПУ",
        algorithmG: "Гильотинный", algorithmGHint: "Прямые сквозные резы",
        minOffcut: "Мин. остаток", minOffcutHint: "Показывать деловые остатки от этого размера",
        recalc: "Пересчитать", recalculated: "Раскрой пересчитан", autoNote: "Результат обновляется автоматически",
        statSheets: "Листов", statWaste: "Отходы", statCost: "Стоимость материала", statParts: "Деталей",
        resultsTitle: "Карты раскроя", resultsSub: "Цвета деталей условные",
        noResultsTitle: "Нет деталей для раскроя", noResultsHint: "Добавьте изделия в конструкторе или отдельные детали — карты раскроя появятся здесь автоматически.",
        goDesigner: "Перейти в конструктор",
        warnings: "Предупреждения", oversized: "Деталь «{name}» {w}×{h} мм не помещается на лист «{material}». Увеличьте лист или уменьшите деталь.",
        warningSheet: "Лист «{material}» слишком мал с учётом обрезки по периметру.",
        warningMaterial: "Материал детали «{name}» не найден в проекте.",
        groupMeta: "{sheets} · {parts}",
        sheetTitle: "Лист {n}", sheetSize: "{w} × {h} мм", sheetMaterial: "{name}, {t} мм",
        wasteShort: "Отходы", costShort: "Стоимость",
        offcuts: "Деловые остатки", offcutsCount: "{n}",
        exportCsv: "Карта раскроя CSV", printReport: "Печать отчёта",
        algorithmNote: "MaxRects-раскрой подходит для ЧПУ и даёт меньше отходов. Гильотинный алгоритм использует только прямые сквозные резы — для форматно-раскроечного станка.",
        statsSheetsHint: "{parts} на листах", statsWasteHint: "от площади листов", statsCostHint: "с учётом цены листов",
        sheetUsed: "Использовано {pct}",
        oversizeBadge: "Не помещается", rotateHintBadge: "Повёрнута",
        errorsCount: "{n} предупреждений", recalculatedToast: "Карты раскроя обновлены",
        noMaterials: "Сначала добавьте материал и детали.",
        legendTitle: "Обозначения",
        wasteLegend: "Отходы", offcutLegend: "Остаток",
        sheetCost: "Цена листа",
        placedParts: "{n} деталей",
        areaShort: "{n} м²",
        printNote: "Сформировано в PanelCraft",
        cutLength: "Длина реза",
        settingsChanged: "Настройки раскроя обновлены",
        autoRecalc: "Пересчитано автоматически",
      },
      materials: {
        add: "Добавить материал", addShort: "Новый материал",
        newTitle: "Новый материал", editTitle: "Редактировать материал",
        name: "Название материала", namePlaceholder: "Например, ЛДСП Дуб Сонома",
        sheet: "Формат листа", sheetLength: "Длина листа", sheetWidth: "Ширина листа",
        thickness: "Толщина, мм", price: "Цена за лист", color: "Цвет материала",
        textured: "Выраженная текстура", texturedHint: "Запретить поворот деталей из этого материала при раскрое.",
        deleteConfirm: "Удалить материал «{name}»?",
        usedWarning: "Материал «{name}» используется в проекте. Сначала назначьте другой материал.",
        cannotDeleteLast: "В проекте должен остаться хотя бы один материал.",
        saved: "Материал сохранён", added: "Материал добавлен", deleted: "Материал удалён",
        usedIn: "Используется: {items}",
        texturedBadge: "Текстура", thinBadge: "Тонкий",
        sheetSpec: "Лист {w} × {h} мм", thickSpec: "{n} мм",
        count: "{n} в проекте", addHint: "Форматы и цены листов используются в расчёте раскроя.",
        errorName: "Укажите название материала.", errorSheet: "Размеры листа должны быть больше нуля.",
        errorThickness: "Толщина должна быть больше нуля.", errorPrice: "Укажите корректную цену.",
        pricePerSheetShort: "лист", details: "Детали",
        usedByItems: "{n} изделий", sheetArea: "Площадь листа {n} м²",
        swatch: "Палитра", pickColor: "Свой цвет",
      },
      project: {
        name: "Название проекта", created: "Создан {date}", updated: "Обновлён {date}",
        statsItems: "Изделия", statsParts: "Детали", statsArea: "Площадь деталей", statsSheets: "Листов в раскрое", statsCost: "Стоимость материала",
        settingsTitle: "Настройки", settingsSub: "Производство и оформление",
        edgeThickness: "Толщина кромки, мм", edgeThicknessHint: "Используется для расчёта погонных метров кромки.",
        currency: "Валюта", language: "Язык интерфейса", theme: "Тема", light: "Светлая", dark: "Тёмная",
        units: "Единицы измерения", unitsValue: "Миллиметры (мм)", unitsHint: "Все размеры проекта задаются в миллиметрах.",
        dataTitle: "Данные проекта", dataSub: "Резервные копии и перенос между устройствами",
        downloadJson: "Скачать проект", downloadJsonHint: "Полная резервная копия в формате JSON",
        importJson: "Загрузить проект", importJsonHint: "Открыть ранее сохранённый JSON-файл",
        newProject: "Новый проект", newProjectHint: "Начать с чистого листа",
        sample: "Демо-проект", sampleHint: "Кухонные шкафы, комод и стеллаж",
        reset: "Сбросить проект", resetHint: "Вернуть исходные демо-данные",
        clearAll: "Очистить локальные данные", clearAllConfirm: "Удалить все сохранённые данные PanelCraft в этом браузере и перезагрузить приложение? Это действие нельзя отменить.",
        dangerTitle: "Опасная зона", dangerHint: "Эти действия нельзя отменить. Сначала скачайте резервную копию, если она нужна.",
        resetConfirm: "Сбросить проект и вернуть демонстрационные данные? Текущие изменения будут потеряны.",
        newConfirm: "Создать новый пустой проект? Текущие данные будут заменены.",
        imported: "Проект загружен", importError: "Не удалось прочитать файл проекта.",
        exported: "Проект сохранён в файл", resetDone: "Демо-проект восстановлен", newDone: "Новый проект создан",
        aboutTitle: "О приложении", aboutText: "PanelCraft объединяет параметрический конструктор корпусной мебели и оптимизатор раскроя листовых материалов. Все расчёты выполняются прямо в браузере.",
        localOnly: "Данные хранятся локально в этом браузере. Для переноса используйте JSON-экспорт.",
        version: "Версия 1.0", tech: "Без внешних зависимостей · Работает офлайн",
        savedLocal: "Сохранено локально", lastSaved: "Последнее сохранение: {time}",
        edgeSummary: "Кромка: {n} п. м.",
        itemsCount: "{n} изделий", partsCount: "{n} деталей",
        backupTip: "Совет: перед крупными изменениями скачайте резервную копию.",
        fileFormat: "PanelCraft project (.json)",
        statsSheetsHint: "при текущих настройках раскроя",
        titlePlaceholder: "Мой проект",
      },
      toast: {
        saved: "Сохранено", error: "Что-то пошло не так", language: "Язык интерфейса изменён",
        theme: "Тема изменена", copied: "Скопировано", help: "Справка",
      },
      help: {
        title: "Как это работает", intro: "Четыре шага от идеи до готовых карт раскроя.",
        step1Title: "1. Соберите изделия", step1Text: "Выберите шаблон шкафа, комода или стеллажа и настройте габариты, полки, фасады и ящики. Детали пересчитываются автоматически.",
        step2Title: "2. Проверьте детали", step2Text: "В разделе «Детали» видны размеры, материалы, кромка и направление текстуры. Добавьте нестандартные детали вручную.",
        step3Title: "3. Настройте раскрой", step3Text: "Укажите ширину пропила, обрезку листа и алгоритм. Для ЧПУ выбирайте максимальную плотность, для форматно-раскроечного станка — гильотинный раскрой.",
        step4Title: "4. Получите карты", step4Text: "Проверьте раскладки, деловые остатки и стоимость материалов, затем распечатайте отчёт или выгрузите CSV.",
        tipTitle: "Все данные — локально", tipText: "Проект автоматически сохраняется в этом браузере. Делайте JSON-резервные копии в разделе «Проект».",
        close: "Понятно",
      },
      partNames: {
        side: "Боковина", top: "Верх", bottom: "Низ", topOverlay: "Крышка", back: "Задняя стенка",
        shelf: "Полка", door: "Фасад", plinth: "Цоколь", drawerFront: "Фасад ящика",
        drawerSide: "Боковина ящика", drawerBox: "Стенка ящика", drawerBottom: "Дно ящика",
      },
      units: { mm: "мм", m2: "м²", pcs: "шт.", m: "п. м.", percent: "%" },
      currency: { RUB: "₽", BYN: "Br", EUR: "€", USD: "$", KZT: "₸", UAH: "₴", GBP: "£" },
    },

    en: {
      app: {
        tagline: "furniture · cutting",
        workspace: "Workspace",
        workshop: "Workshop",
        autosave: "Autosave is on",
        name: "PanelCraft",
        version: "Version 1.0",
      },
      nav: { designer: "Designer", parts: "Parts", cutting: "Cutting", materials: "Materials", project: "Project" },
      page: {
        designer: { title: "Designer", subtitle: "Build case furniture from parametric templates — the parts list is recalculated automatically." },
        parts: { title: "Project parts", subtitle: "A complete bill of materials: sizes, materials, edge banding and grain direction." },
        cutting: { title: "Cutting layouts", subtitle: "Optimal placement of parts on sheets with kerf, trim and grain constraints." },
        materials: { title: "Materials", subtitle: "Sheet goods, formats, prices and settings used for cutting optimization." },
        project: { title: "Project", subtitle: "General settings, project data and backups." },
      },
      common: {
        add: "Add", edit: "Edit", delete: "Delete", duplicate: "Duplicate", save: "Save",
        cancel: "Cancel", close: "Close", apply: "Apply", export: "Export", import: "Import",
        print: "Print", search: "Search", all: "All", reset: "Reset", create: "Create", open: "Open",
        total: "Total", actions: "Actions", name: "Name", quantity: "Qty", material: "Material",
        color: "Color", price: "Price", width: "Width", height: "Height", depth: "Depth", length: "Length",
        thickness: "Thickness", area: "Area", none: "None", optional: "optional", used: "In use",
        custom: "Custom part", generated: "Furniture", confirmTitle: "Please confirm", back: "Back",
        done: "Done", more: "Details", item: "item", items: "items", parts: "parts", sheets: "sheets",
        pieces: "pcs", mm: "mm", m2: "m²", pcs: "pcs", unitPrice: "Price", perSheet: "per sheet",
        yes: "Yes", no: "No", cancelShort: "Cancel", unnamed: "Untitled", copySuffix: "copy",
        closeEsc: "Esc to close", noneSelected: "Not selected", choose: "Choose",
      },
      plurals: {
        item: ["item", "items"],
        part: ["part", "parts"],
        sheet: ["sheet", "sheets"],
        material: ["material", "materials"],
        offcut: ["offcut", "offcuts"],
        row: ["row", "rows"],
      },
      templates: {
        cabinet: "Case cabinet", chest: "Drawer chest", rack: "Open shelving",
        cabinetDesc: "Cabinet, base unit, wardrobe", chestDesc: "Stacked drawers", rackDesc: "Open shelves",
        choose: "New item", chooseHint: "Pick a parametric template — dimensions and composition are fully editable.",
      },
      params: {
        width: "Width", height: "Height", depth: "Depth", shelves: "Shelves", doors: "Doors",
        doorSections: "Sections", drawers: "Drawers", plinth: "Plinth", plinthHeight: "Plinth height", doorGap: "Door gap",
        backPanel: "Back panel", bodyMaterial: "Carcass material", facadeMaterial: "Front material",
        backMaterial: "Back material", dimensions: "Dimensions", construction: "Construction",
        facades: "Fronts & storage", allMm: "All dimensions in millimetres", bodyHint: "Carcass thickness comes from the material.",
        backThicknessHint: "Use a thin back material, e.g. HDF 4 mm.",
        doorGapHint: "Gap between fronts and carcass edges.",
        doorSectionsHint: "Each door is split into equal sections by height.",
        noFacadeMaterial: "No fronts", edgeAll: "all around",
        shelvesHint: "Internal shelves", drawersHint: "Drawer boxes with bottoms",
      },
      designer: {
        itemsTitle: "Items", addItem: "Add item", addItemHint: "Template",
        noItemsTitle: "No items yet", noItemsHint: "Create your first item from a template — parts will instantly appear in the bill of materials and cutting.",
        createFirst: "Create an item", namePlaceholder: "Item name",
        itemName: "Item name", deleteItem: "Delete item",
        deleteConfirm: "Delete “{name}”? All of its parts will disappear from the bill of materials and cutting.",
        added: "Item added", duplicated: "Item duplicated", deleted: "Item deleted",
        front: "Elevation", layout: "Layout", iso: "3D", previewTitle: "Preview", previewSub: "Not to scale",
        generatedTitle: "Item parts", generatedSub: "{rows} · {parts}",
        openParts: "All project parts", emptyParts: "This item has no parts yet.",
        statDims: "Dimensions", statArea: "Parts area", statParts: "Parts",
        noFacades: "No fronts", withFacades: "{n} fronts", backType: "Inset",
        previewNote: "Fronts are shown translucent", itemToolbarHint: "Parametric model",
        grainLocked: "Grain along length",
        deleteTitle: "Delete item",
        quantityRows: "Rows",
        shelvesCount: "Shelves: {n}", doorsCount: "Doors: {n}", drawersCount: "Drawers: {n}",
        layoutNote: "Schematic: internal shelves and fronts",
        layoutShelfHint: "Click a shelf in the layout to remove or restore it",
        resizeWidth: "Resize width", resizeHeight: "Resize height",
        resizeHint: "Drag the handles on the drawing to resize",
        tip: "Drag the sliders — parts and cutting layouts update instantly.",
        templateBadge: "Template",
      },
      parts: {
        addPart: "Add custom part", addPartShort: "Custom part",
        newPartTitle: "New custom part", editPartTitle: "Edit custom part",
        newPartHint: "This part is independent of items and goes straight into cutting.",
        partName: "Part name", namePlaceholder: "e.g. corner shelf",
        length: "Length", width: "Width", qty: "Quantity", material: "Material",
        grain: "Grain direction", grainLock: "Lock along length",
        grainHint: "This part will not be rotated during nesting.",
        edges: "Edge banding", edgesHint: "Mark the banded edges.",
        edgeTop: "Top", edgeBottom: "Bottom", edgeLeft: "Left", edgeRight: "Right",
        searchPlaceholder: "Search parts…", allMaterials: "All materials",
        statRows: "Rows", statParts: "Total parts", statArea: "Parts area", statBanding: "Edge banding",
        tablePart: "Part", tableMaterial: "Material", tableSize: "Size, mm", tableQty: "Qty",
        tableEdges: "Edges", tableGrain: "Grain", tableSource: "Source",
        sourceItem: "Item: {name}", sourceCustom: "Custom part", sourceGenerated: "Parametric",
        linkedTip: "This part is generated by an item. Change the item in the designer.",
        goToItem: "Open in designer", deleteConfirm: "Delete “{name}” from the project?",
        saved: "Part saved", deleted: "Part deleted", errorName: "Enter a part name.",
        errorSize: "Length and width must be greater than zero.", errorQty: "Quantity must be between 1 and 999.",
        errorMaterial: "Choose a material.",
        emptyTitle: "No parts yet", emptyHint: "Add an item in the designer or create a custom part.",
        edgeNone: "No banding", grainFree: "Free", grainLockedShort: "Along length",
        rowsShown: "Showing {shown} of {total}",
        lockedNotice: "Generated parts can't be edited directly — change the item parameters instead.",
        edgeMeters: "{n} lm", totalParts: "{n}",
        searchEmptyTitle: "Nothing found", searchEmptyHint: "Try another query or material filter.",
        customBadge: "Custom", allParts: "All parts",
      },
      cutting: {
        paramsTitle: "Cutting settings", paramsSub: "Kerf, trim and placement strategy",
        kerf: "Kerf", kerfHint: "Saw blade / router width",
        trim: "Sheet trim", trimHint: "Margin around sheet edges",
        rotate: "Allow rotation", rotateHint: "Except parts with locked grain",
        algorithm: "Algorithm", algorithmMR: "Maximum yield", algorithmMRHint: "Free nesting, CNC",
        algorithmG: "Guillotine", algorithmGHint: "Straight through-cuts",
        minOffcut: "Min. offcut", minOffcutHint: "List reusable offcuts from this size",
        recalc: "Recalculate", recalculated: "Layouts recalculated", autoNote: "Results update automatically",
        statSheets: "Sheets", statWaste: "Waste", statCost: "Material cost", statParts: "Parts",
        resultsTitle: "Cutting layouts", resultsSub: "Part colors are indicative",
        noResultsTitle: "No parts to cut yet", noResultsHint: "Add items in the designer or custom parts — cutting layouts will appear here automatically.",
        goDesigner: "Go to designer",
        warnings: "Warnings", oversized: "Part “{name}” {w}×{h} mm does not fit on “{material}”. Use a larger sheet or reduce the part.",
        warningSheet: "Sheet “{material}” is too small after edge trimming.",
        warningMaterial: "The material for part “{name}” is missing from the project.",
        groupMeta: "{sheets} · {parts}",
        sheetTitle: "Sheet {n}", sheetSize: "{w} × {h} mm", sheetMaterial: "{name}, {t} mm",
        wasteShort: "Waste", costShort: "Cost",
        offcuts: "Reusable offcuts", offcutsCount: "{n}",
        exportCsv: "Cut list CSV", printReport: "Print report",
        algorithmNote: "MaxRects nesting suits CNC routers and yields less waste. The guillotine algorithm uses straight through-cuts only — suitable for a panel saw.",
        statsSheetsHint: "{parts} placed on sheets", statsWasteHint: "of sheet area", statsCostHint: "based on sheet prices",
        sheetUsed: "{pct} used",
        oversizeBadge: "Doesn't fit", rotateHintBadge: "Rotated",
        errorsCount: "{n} warnings", recalculatedToast: "Cutting layouts updated",
        noMaterials: "Add materials and parts first.",
        legendTitle: "Legend",
        wasteLegend: "Waste", offcutLegend: "Offcut",
        sheetCost: "Sheet price",
        placedParts: "{n} parts",
        areaShort: "{n} m²",
        printNote: "Generated with PanelCraft",
        cutLength: "Cut length",
        settingsChanged: "Cutting settings updated",
        autoRecalc: "Recalculated automatically",
      },
      materials: {
        add: "Add material", addShort: "New material",
        newTitle: "New material", editTitle: "Edit material",
        name: "Material name", namePlaceholder: "e.g. Oak Sonoma melamine",
        sheet: "Sheet format", sheetLength: "Sheet length", sheetWidth: "Sheet width",
        thickness: "Thickness, mm", price: "Price per sheet", color: "Material color",
        textured: "Pronounced grain", texturedHint: "Parts made of this material cannot be rotated during nesting.",
        deleteConfirm: "Delete material “{name}”?",
        usedWarning: "“{name}” is used in this project. Reassign those items first.",
        cannotDeleteLast: "The project must contain at least one material.",
        saved: "Material saved", added: "Material added", deleted: "Material deleted",
        usedIn: "Used by: {items}",
        texturedBadge: "Grain", thinBadge: "Thin",
        sheetSpec: "Sheet {w} × {h} mm", thickSpec: "{n} mm",
        count: "{n} in project", addHint: "Sheet formats and prices feed the cutting optimization.",
        errorName: "Enter a material name.", errorSheet: "Sheet dimensions must be greater than zero.",
        errorThickness: "Thickness must be greater than zero.", errorPrice: "Enter a valid price.",
        pricePerSheetShort: "sheet", details: "Details",
        usedByItems: "{n} items", sheetArea: "Sheet area {n} m²",
        swatch: "Swatches", pickColor: "Custom color",
      },
      project: {
        name: "Project name", created: "Created {date}", updated: "Updated {date}",
        statsItems: "Items", statsParts: "Parts", statsArea: "Parts area", statsSheets: "Cutting sheets", statsCost: "Material cost",
        settingsTitle: "Settings", settingsSub: "Workshop & appearance",
        edgeThickness: "Edge band thickness, mm", edgeThicknessHint: "Used to calculate edge banding linear metres.",
        currency: "Currency", language: "Interface language", theme: "Theme", light: "Light", dark: "Dark",
        units: "Units", unitsValue: "Millimetres (mm)", unitsHint: "All project dimensions are set in millimetres.",
        dataTitle: "Project data", dataSub: "Backups and moving between devices",
        downloadJson: "Download project", downloadJsonHint: "Full backup as a JSON file",
        importJson: "Load project", importJsonHint: "Open a previously saved JSON file",
        newProject: "New project", newProjectHint: "Start from a clean slate",
        sample: "Demo project", sampleHint: "Kitchen cabinets, a chest and shelving",
        reset: "Reset project", resetHint: "Restore the original demo data",
        clearAll: "Clear local data", clearAllConfirm: "Delete all PanelCraft data saved in this browser and reload the app? This cannot be undone.",
        dangerTitle: "Danger zone", dangerHint: "These actions can't be undone. Download a backup first if you need one.",
        resetConfirm: "Reset the project and restore demo data? Current changes will be lost.",
        newConfirm: "Create a new empty project? Current data will be replaced.",
        imported: "Project loaded", importError: "Could not read the project file.",
        exported: "Project saved to file", resetDone: "Demo project restored", newDone: "New project created",
        aboutTitle: "About", aboutText: "PanelCraft combines a parametric case-furniture designer with a sheet-goods cutting optimizer. All calculations run directly in your browser.",
        localOnly: "Data is stored locally in this browser. Use the JSON export to move it.",
        version: "Version 1.0", tech: "No external dependencies · Works offline",
        savedLocal: "Saved locally", lastSaved: "Last save: {time}",
        edgeSummary: "Edge banding: {n} lm",
        itemsCount: "{n} items", partsCount: "{n} parts",
        backupTip: "Tip: download a backup before major changes.",
        fileFormat: "PanelCraft project (.json)",
        statsSheetsHint: "at current cutting settings",
        titlePlaceholder: "My project",
      },
      toast: {
        saved: "Saved", error: "Something went wrong", language: "Interface language changed",
        theme: "Theme changed", copied: "Copied", help: "Help",
      },
      help: {
        title: "How it works", intro: "Four steps from an idea to finished cutting layouts.",
        step1Title: "1. Build your items", step1Text: "Choose a cabinet, chest or shelving template and tune dimensions, shelves, fronts and drawers. Parts are recalculated automatically.",
        step2Title: "2. Review the parts", step2Text: "The Parts view shows sizes, materials, edge banding and grain direction. Add any custom parts by hand.",
        step3Title: "3. Set up cutting", step3Text: "Set kerf, sheet trim and the algorithm. Use maximum yield for a CNC router, guillotine for straight cuts on a panel saw.",
        step4Title: "4. Get your maps", step4Text: "Inspect layouts, reusable offcuts and material cost, then print the report or export a CSV cut list.",
        tipTitle: "Everything stays local", tipText: "Your project autosaves in this browser. Make JSON backups from the Project page.",
        close: "Got it",
      },
      partNames: {
        side: "Side panel", top: "Top", bottom: "Bottom", topOverlay: "Top panel", back: "Back panel",
        shelf: "Shelf", door: "Door", plinth: "Plinth", drawerFront: "Drawer front",
        drawerSide: "Drawer side", drawerBox: "Drawer box panel", drawerBottom: "Drawer bottom",
      },
      units: { mm: "mm", m2: "m²", pcs: "pcs", m: "lm", percent: "%" },
      currency: { RUB: "₽", BYN: "Br", EUR: "€", USD: "$", KZT: "₸", UAH: "₴", GBP: "£" },
    },
  };

  let lang = "ru";
  try {
    const stored = localStorage.getItem("panelcraft.lang");
    const preferred = (navigator.language || "ru").toLowerCase().startsWith("ru") ? "ru" : "en";
    lang = stored === "ru" || stored === "en" ? stored : preferred;
  } catch (_) { lang = "ru"; }
  if (lang !== "ru" && lang !== "en") lang = "ru";

  function t(key, vars) {
    let value = key.split(".").reduce((obj, part) => (obj == null ? obj : obj[part]), DICT[lang]);
    if (value == null) value = key.split(".").reduce((obj, part) => (obj == null ? obj : obj[part]), DICT.en);
    if (value == null) return key;
    if (typeof value !== "string") return value;
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, (match, name) => (vars[name] == null ? match : String(vars[name])));
    }
    return value;
  }

  function locale() { return lang === "ru" ? "ru-RU" : "en-US"; }

  function number(value, digits) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat(locale(), {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits == null ? 2 : digits,
    }).format(n);
  }

  function money(value, currency) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    const code = currency || "RUB";
    try {
      return new Intl.NumberFormat(locale(), {
        style: "currency", currency: code, minimumFractionDigits: 0, maximumFractionDigits: 2,
      }).format(n);
    } catch (_) {
      return `${number(n, 0)} ${code}`;
    }
  }

  function area(m2) { return `${number(m2, 2)} ${t("units.m2")}`; }
  function mm(value) { return `${number(value, 0)} ${t("units.mm")}`; }
  function pct(value) { return `${number(value, 1)}${t("units.percent")}`; }

  function date(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(d);
  }

  function dateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
  }

  function word(n, key) {
    const forms = (DICT[lang].plurals && DICT[lang].plurals[key]) || [];
    if (!forms.length) return "";
    if (lang === "ru") {
      const abs = Math.abs(Number(n)) % 100;
      const last = abs % 10;
      if (abs > 10 && abs < 20) return forms[2];
      if (last === 1) return forms[0];
      if (last >= 2 && last <= 4) return forms[1];
      return forms[2];
    }
    return Number(n) === 1 ? forms[0] : forms[1];
  }

  function count(n, key) { return `${number(n, 0)} ${word(n, key)}`; }

  function setLang(next) {
    if (next !== "ru" && next !== "en") return;
    lang = next;
    try { localStorage.setItem("panelcraft.lang", lang); } catch (_) {}
    document.documentElement.lang = lang;
  }

  function getLang() { return lang; }

  function toggleLang() { setLang(lang === "ru" ? "en" : "ru"); return lang; }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = t(key);
      if (typeof value === "string") el.textContent = value;
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const value = t(el.getAttribute("data-i18n-title"));
      if (typeof value === "string") el.setAttribute("title", value);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const value = t(el.getAttribute("data-i18n-placeholder"));
      if (typeof value === "string") el.setAttribute("placeholder", value);
    });
  }

  function partName(part) {
    if (!part) return "";
    if (part.nameKey) return t(`partNames.${part.nameKey}`);
    return part.name || t("common.unnamed");
  }

  window.I18n = {
    t, number, money, area, mm, pct, date, dateTime, word, count,
    setLang, getLang, toggleLang, apply, partName, locale,
    languages: ["ru", "en"],
    dictionary: DICT,
  };
})();

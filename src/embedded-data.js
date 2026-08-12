window.DECORIUM_DATA = {
  "constraints": {
    "constraints/scandinavian-constraints.json": [
      {
        "id": "scand-wood-min",
        "styleId": "scandinavian",
        "feature": "woodShare",
        "operator": ">=",
        "threshold": 0.5,
        "weight": 2,
        "messageKey": "scand-wood-low"
      },
      {
        "id": "scand-form-simple",
        "styleId": "scandinavian",
        "feature": "formSimplicity",
        "operator": ">=",
        "threshold": 0.6,
        "weight": 1.5,
        "messageKey": "scand-form-complex"
      },
      {
        "id": "scand-saturation-low",
        "styleId": "scandinavian",
        "feature": "saturationLevel",
        "operator": "<=",
        "threshold": 0.5,
        "weight": 1,
        "messageKey": "scand-saturation-high"
      },
      {
        "id": "scand-plastic-free",
        "styleId": "scandinavian",
        "feature": "plasticShare",
        "operator": "<=",
        "threshold": 0.1,
        "weight": 1.5,
        "messageKey": "scand-plastic-high"
      },
      {
        "id": "scand-warm-tone",
        "styleId": "scandinavian",
        "feature": "warmPaletteShare",
        "operator": ">=",
        "threshold": 0.5,
        "weight": 1,
        "messageKey": "scand-color-cold"
      }
    ]
  },
  "feedback": {
    "feedback/messages.ru.json": {
      "version": "1.0",
      "locale": "ru",
      "categories": {
        "color": [
          {
            "key": "color_too_dark",
            "text": "В комнате слишком много темных тонов, стало мрачновато."
          },
          {
            "key": "color_too_bright",
            "text": "Цветовая гамма чрезмерно яркая, глаза устают."
          },
          {
            "key": "color_mismatch",
            "text": "Цвета предметов плохо сочетаются друг с другом."
          },
          {
            "key": "color_perfect",
            "text": "Отличное сочетание цветов, очень гармонично!"
          },
          {
            "key": "color_cold",
            "text": "В интерьере не хватает теплых оттенков, немного холодно."
          }
        ],
        "materials": [
          {
            "key": "mat_too_wood",
            "text": "Дерева слишком много, это выглядит перегруженным."
          },
          {
            "key": "mat_too_metal",
            "text": "Металлические поверхности доминируют, интерьер стал строгим."
          },
          {
            "key": "mat_no_textiles",
            "text": "Не хватает текстиля для уюта."
          },
          {
            "key": "mat_mix_good",
            "text": "Баланс материалов соблюден идеально."
          },
          {
            "key": "mat_plastic_excess",
            "text": "Слишком много пластика, это удешевляет вид."
          }
        ],
        "geometry": [
          {
            "key": "geo_too_round",
            "text": "Слишком много округлых форм, нет четкости."
          },
          {
            "key": "geo_too_strict",
            "text": "Интерьер слишком угловатый и строгий."
          },
          {
            "key": "geo_size_big",
            "text": "Мебель слишком громоздкая для этой комнаты."
          },
          {
            "key": "geo_size_small",
            "text": "Предметы выглядят мелко и потерянно."
          },
          {
            "key": "geo_balance_ok",
            "text": "Геометрические пропорции выглядят отлично."
          }
        ],
        "structure": [
          {
            "key": "struct_no_storage",
            "text": "Критически не хватает мест для хранения."
          },
          {
            "key": "struct_no_lighting",
            "text": "В комнате темно, не хватает источников света."
          },
          {
            "key": "struct_overloaded",
            "text": "Комната перенасыщена функциональными элементами."
          },
          {
            "key": "struct_empty",
            "text": "В интерьере не хватает смысла, он кажется пустым."
          }
        ],
        "ergonomics": [
          {
            "key": "ergo_no_path",
            "text": "Здесь не пройти! Мебель перекрывает проход."
          },
          {
            "key": "ergo_door_blocked",
            "text": "Дверь заблокирована, это нарушает безопасность."
          },
          {
            "key": "ergo_window_blocked",
            "text": "Доступ к окну перекрыт."
          },
          {
            "key": "ergo_balance_bad",
            "text": "Расстановка мебели хаотична, нарушен баланс зоны 3x3."
          },
          {
            "key": "ergo_good_flow",
            "text": "Удобная планировка, легко перемещаться."
          }
        ],
        "general": [
          {
            "key": "gen_great_job",
            "text": "Превосходная работа! Клиент будет в восторге."
          },
          {
            "key": "gen_not_bad",
            "text": "Неплохо, но есть куда расти."
          },
          {
            "key": "gen_try_again",
            "text": "Попробуйте переставить мебель, текущий вариант слабый."
          },
          {
            "key": "gen_budget_waste",
            "text": "Бюджет использован неэффективно."
          },
          {
            "key": "gen_style_match",
            "text": "Попадание в стиль безупречное!"
          }
        ]
      }
    },
    "feedback/scandinavian-feedback.json": [
      {
        "id": "scand-wood-low",
        "category": "violation",
        "template": "Слишком мало дерева. Скандинавский стиль требует натуральных материалов (минимум {threshold}, у вас {value}).",
        "severity": "high"
      },
      {
        "id": "scand-form-complex",
        "category": "violation",
        "template": "Формы слишком сложные. Скандинавский стиль любит минимализм и простоту (максимум {threshold}, у вас {value}).",
        "severity": "medium"
      },
      {
        "id": "scand-saturation-high",
        "category": "violation",
        "template": "Слишком яркие цвета. Скандинавский стиль предпочитает спокойные, приглушенные тона (максимум {threshold}, у вас {value}).",
        "severity": "medium"
      },
      {
        "id": "scand-plastic-high",
        "category": "violation",
        "template": "Много пластика. Скандинавский стиль использует натуральные материалы (максимум {threshold}, у вас {value}).",
        "severity": "high"
      },
      {
        "id": "scand-color-cold",
        "category": "violation",
        "template": "Слишком холодные тона. Добавьте теплого уюта (минимум {threshold}, у вас {value}).",
        "severity": "low"
      },
      {
        "id": "success-excellent",
        "category": "success",
        "template": "Великолепно! Комната идеально соответствует скандинавскому стилю.",
        "severity": "high"
      },
      {
        "id": "success-good",
        "category": "success",
        "template": "Хорошая работа! Комната выглядит уютно и стильно.",
        "severity": "medium"
      },
      {
        "id": "tip-more-items",
        "category": "tip",
        "template": "Попробуйте добавить больше предметов для завершенности композиции.",
        "severity": "low"
      }
    ]
  },
  "items": {
    "items/catalog.v2.json": {
      "$schema": "item.v2.json",
      "items": [
        {
          "id": "chair-001",
          "name": "Стул Modern",
          "type": "chair",
          "dimensions": {
            "x": 0.5,
            "z": 0.5
          },
          "price": 150,
          "featureVector": {
            "woodShare": 0.7,
            "metalShare": 0.2,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.3,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.8,
            "saturationLevel": 0.4,
            "formSimplicity": 0.9,
            "roundnessShare": 0.3,
            "rectilinearShare": 0.7,
            "sizeNorm": 0.3,
            "priceNorm": 0.2,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "chair-002",
          "name": "Кресло Comfort",
          "type": "chair",
          "dimensions": {
            "x": 0.8,
            "z": 0.8
          },
          "price": 350,
          "featureVector": {
            "woodShare": 0.4,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.2,
            "textileShare": 0.8,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.5,
            "formSimplicity": 0.7,
            "roundnessShare": 0.6,
            "rectilinearShare": 0.4,
            "sizeNorm": 0.5,
            "priceNorm": 0.5,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "table-001",
          "name": "Стол обеденный",
          "type": "table",
          "dimensions": {
            "x": 1.8,
            "z": 0.9
          },
          "price": 500,
          "featureVector": {
            "woodShare": 0.9,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.7,
            "darkColorShare": 0.3,
            "warmPaletteShare": 0.9,
            "saturationLevel": 0.3,
            "formSimplicity": 0.8,
            "roundnessShare": 0.2,
            "rectilinearShare": 0.8,
            "sizeNorm": 0.8,
            "priceNorm": 0.6,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "table-002",
          "name": "Журнальный стол",
          "type": "table",
          "dimensions": {
            "x": 1,
            "z": 0.6
          },
          "price": 200,
          "featureVector": {
            "woodShare": 0.6,
            "metalShare": 0.3,
            "glassShare": 0.1,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.4,
            "darkColorShare": 0.6,
            "warmPaletteShare": 0.5,
            "saturationLevel": 0.4,
            "formSimplicity": 0.9,
            "roundnessShare": 0.4,
            "rectilinearShare": 0.6,
            "sizeNorm": 0.4,
            "priceNorm": 0.3,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "sofa-001",
          "name": "Диван угловой",
          "type": "sofa",
          "dimensions": {
            "x": 2.5,
            "z": 1.8
          },
          "price": 800,
          "featureVector": {
            "woodShare": 0.2,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.9,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.5,
            "formSimplicity": 0.6,
            "roundnessShare": 0.5,
            "rectilinearShare": 0.5,
            "sizeNorm": 1,
            "priceNorm": 0.9,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.1
          }
        },
        {
          "id": "sofa-002",
          "name": "Диван прямой",
          "type": "sofa",
          "dimensions": {
            "x": 2,
            "z": 0.9
          },
          "price": 600,
          "featureVector": {
            "woodShare": 0.3,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.8,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.6,
            "formSimplicity": 0.7,
            "roundnessShare": 0.4,
            "rectilinearShare": 0.6,
            "sizeNorm": 0.8,
            "priceNorm": 0.7,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "lamp-001",
          "name": "Лампа настольная",
          "type": "lighting",
          "dimensions": {
            "x": 0.3,
            "z": 0.3
          },
          "price": 100,
          "featureVector": {
            "woodShare": 0.2,
            "metalShare": 0.6,
            "glassShare": 0.2,
            "plasticShare": 0.1,
            "textileShare": 0.1,
            "lightColorShare": 0.8,
            "darkColorShare": 0.2,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.3,
            "formSimplicity": 0.8,
            "roundnessShare": 0.7,
            "rectilinearShare": 0.3,
            "sizeNorm": 0.2,
            "priceNorm": 0.1,
            "lightingFunctionShare": 1,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "lamp-002",
          "name": "Торшер высокий",
          "type": "lighting",
          "dimensions": {
            "x": 0.4,
            "z": 0.4
          },
          "price": 180,
          "featureVector": {
            "woodShare": 0.3,
            "metalShare": 0.5,
            "glassShare": 0.1,
            "plasticShare": 0.1,
            "textileShare": 0.2,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.4,
            "formSimplicity": 0.9,
            "roundnessShare": 0.5,
            "rectilinearShare": 0.5,
            "sizeNorm": 0.4,
            "priceNorm": 0.2,
            "lightingFunctionShare": 1,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "shelf-001",
          "name": "Полка настенная",
          "type": "storage",
          "dimensions": {
            "x": 1.2,
            "z": 0.3
          },
          "price": 120,
          "featureVector": {
            "woodShare": 0.8,
            "metalShare": 0.2,
            "glassShare": 0,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.3,
            "formSimplicity": 0.9,
            "roundnessShare": 0.1,
            "rectilinearShare": 0.9,
            "sizeNorm": 0.5,
            "priceNorm": 0.15,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.8
          }
        },
        {
          "id": "shelf-002",
          "name": "Шкаф книжный",
          "type": "storage",
          "dimensions": {
            "x": 1,
            "z": 0.4
          },
          "price": 450,
          "featureVector": {
            "woodShare": 0.9,
            "metalShare": 0.1,
            "glassShare": 0.1,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.4,
            "darkColorShare": 0.6,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.3,
            "formSimplicity": 0.8,
            "roundnessShare": 0.1,
            "rectilinearShare": 0.9,
            "sizeNorm": 0.9,
            "priceNorm": 0.5,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 1
          }
        },
        {
          "id": "cabinet-001",
          "name": "Комод",
          "type": "storage",
          "dimensions": {
            "x": 1.4,
            "z": 0.5
          },
          "price": 380,
          "featureVector": {
            "woodShare": 0.85,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.05,
            "textileShare": 0,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.8,
            "saturationLevel": 0.4,
            "formSimplicity": 0.7,
            "roundnessShare": 0.2,
            "rectilinearShare": 0.8,
            "sizeNorm": 0.7,
            "priceNorm": 0.45,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.95
          }
        },
        {
          "id": "bed-001",
          "name": "Кровать двуспальная",
          "type": "bed",
          "dimensions": {
            "x": 1.8,
            "z": 2
          },
          "price": 700,
          "featureVector": {
            "woodShare": 0.6,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.7,
            "lightColorShare": 0.7,
            "darkColorShare": 0.3,
            "warmPaletteShare": 0.8,
            "saturationLevel": 0.4,
            "formSimplicity": 0.8,
            "roundnessShare": 0.3,
            "rectilinearShare": 0.7,
            "sizeNorm": 0.95,
            "priceNorm": 0.8,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.2
          }
        },
        {
          "id": "bed-002",
          "name": "Кровать односпальная",
          "type": "bed",
          "dimensions": {
            "x": 1,
            "z": 2
          },
          "price": 400,
          "featureVector": {
            "woodShare": 0.65,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.6,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.5,
            "formSimplicity": 0.85,
            "roundnessShare": 0.25,
            "rectilinearShare": 0.75,
            "sizeNorm": 0.6,
            "priceNorm": 0.5,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.15
          }
        },
        {
          "id": "desk-001",
          "name": "Письменный стол",
          "type": "table",
          "dimensions": {
            "x": 1.4,
            "z": 0.7
          },
          "price": 320,
          "featureVector": {
            "woodShare": 0.7,
            "metalShare": 0.25,
            "glassShare": 0.05,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.4,
            "formSimplicity": 0.8,
            "roundnessShare": 0.2,
            "rectilinearShare": 0.8,
            "sizeNorm": 0.6,
            "priceNorm": 0.4,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.3
          }
        },
        {
          "id": "rug-001",
          "name": "Ковер большой",
          "type": "decor",
          "dimensions": {
            "x": 2,
            "z": 1.5
          },
          "price": 250,
          "featureVector": {
            "woodShare": 0,
            "metalShare": 0,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 1,
            "lightColorShare": 0.4,
            "darkColorShare": 0.6,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.7,
            "formSimplicity": 0.9,
            "roundnessShare": 0.1,
            "rectilinearShare": 0.9,
            "sizeNorm": 0.8,
            "priceNorm": 0.3,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "rug-002",
          "name": "Ковер маленький",
          "type": "decor",
          "dimensions": {
            "x": 1,
            "z": 0.8
          },
          "price": 120,
          "featureVector": {
            "woodShare": 0,
            "metalShare": 0,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.95,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.8,
            "saturationLevel": 0.6,
            "formSimplicity": 0.9,
            "roundnessShare": 0.6,
            "rectilinearShare": 0.4,
            "sizeNorm": 0.3,
            "priceNorm": 0.15,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "curtain-001",
          "name": "Шторы плотные",
          "type": "decor",
          "dimensions": {
            "x": 2.5,
            "z": 0.1
          },
          "price": 200,
          "featureVector": {
            "woodShare": 0,
            "metalShare": 0,
            "glassShare": 0,
            "plasticShare": 0.05,
            "textileShare": 1,
            "lightColorShare": 0.3,
            "darkColorShare": 0.7,
            "warmPaletteShare": 0.5,
            "saturationLevel": 0.5,
            "formSimplicity": 0.9,
            "roundnessShare": 0.1,
            "rectilinearShare": 0.9,
            "sizeNorm": 0.7,
            "priceNorm": 0.25,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "plant-001",
          "name": "Растение в горшке",
          "type": "decor",
          "dimensions": {
            "x": 0.3,
            "z": 0.3
          },
          "price": 80,
          "featureVector": {
            "woodShare": 0.1,
            "metalShare": 0,
            "glassShare": 0,
            "plasticShare": 0.2,
            "textileShare": 0,
            "lightColorShare": 0.2,
            "darkColorShare": 0.1,
            "warmPaletteShare": 0.3,
            "saturationLevel": 0.9,
            "formSimplicity": 0.6,
            "roundnessShare": 0.8,
            "rectilinearShare": 0.2,
            "sizeNorm": 0.2,
            "priceNorm": 0.1,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "mirror-001",
          "name": "Зеркало настенное",
          "type": "decor",
          "dimensions": {
            "x": 0.8,
            "z": 0.05
          },
          "price": 150,
          "featureVector": {
            "woodShare": 0.2,
            "metalShare": 0.1,
            "glassShare": 0.9,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.8,
            "darkColorShare": 0.2,
            "warmPaletteShare": 0.5,
            "saturationLevel": 0.2,
            "formSimplicity": 0.9,
            "roundnessShare": 0.3,
            "rectilinearShare": 0.7,
            "sizeNorm": 0.5,
            "priceNorm": 0.2,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "chair-003",
          "name": "Стул офисный",
          "type": "chair",
          "dimensions": {
            "x": 0.6,
            "z": 0.6
          },
          "price": 280,
          "featureVector": {
            "woodShare": 0.1,
            "metalShare": 0.4,
            "glassShare": 0,
            "plasticShare": 0.3,
            "textileShare": 0.5,
            "lightColorShare": 0.4,
            "darkColorShare": 0.6,
            "warmPaletteShare": 0.4,
            "saturationLevel": 0.5,
            "formSimplicity": 0.7,
            "roundnessShare": 0.5,
            "rectilinearShare": 0.5,
            "sizeNorm": 0.4,
            "priceNorm": 0.35,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "table-003",
          "name": "Стол компьютерный",
          "type": "table",
          "dimensions": {
            "x": 1.6,
            "z": 0.8
          },
          "price": 420,
          "featureVector": {
            "woodShare": 0.5,
            "metalShare": 0.4,
            "glassShare": 0.1,
            "plasticShare": 0.1,
            "textileShare": 0,
            "lightColorShare": 0.3,
            "darkColorShare": 0.7,
            "warmPaletteShare": 0.4,
            "saturationLevel": 0.4,
            "formSimplicity": 0.8,
            "roundnessShare": 0.1,
            "rectilinearShare": 0.9,
            "sizeNorm": 0.7,
            "priceNorm": 0.5,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.4
          }
        },
        {
          "id": "lamp-003",
          "name": "Люстра потолочная",
          "type": "lighting",
          "dimensions": {
            "x": 0.6,
            "z": 0.6
          },
          "price": 350,
          "featureVector": {
            "woodShare": 0.1,
            "metalShare": 0.3,
            "glassShare": 0.6,
            "plasticShare": 0.1,
            "textileShare": 0,
            "lightColorShare": 0.9,
            "darkColorShare": 0.1,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.3,
            "formSimplicity": 0.6,
            "roundnessShare": 0.8,
            "rectilinearShare": 0.2,
            "sizeNorm": 0.5,
            "priceNorm": 0.4,
            "lightingFunctionShare": 1,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "shelf-003",
          "name": "Стеллаж высокий",
          "type": "storage",
          "dimensions": {
            "x": 0.8,
            "z": 0.35
          },
          "price": 280,
          "featureVector": {
            "woodShare": 0.7,
            "metalShare": 0.25,
            "glassShare": 0.05,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.3,
            "formSimplicity": 0.85,
            "roundnessShare": 0.1,
            "rectilinearShare": 0.9,
            "sizeNorm": 0.8,
            "priceNorm": 0.35,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.85
          }
        },
        {
          "id": "ottoman-001",
          "name": "Пуфик",
          "type": "chair",
          "dimensions": {
            "x": 0.5,
            "z": 0.5
          },
          "price": 90,
          "featureVector": {
            "woodShare": 0.1,
            "metalShare": 0.05,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.9,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.5,
            "formSimplicity": 0.9,
            "roundnessShare": 0.7,
            "rectilinearShare": 0.3,
            "sizeNorm": 0.25,
            "priceNorm": 0.1,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "bench-001",
          "name": "Скамья прихожая",
          "type": "chair",
          "dimensions": {
            "x": 1.2,
            "z": 0.4
          },
          "price": 180,
          "featureVector": {
            "woodShare": 0.8,
            "metalShare": 0.15,
            "glassShare": 0,
            "plasticShare": 0.05,
            "textileShare": 0.1,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.4,
            "formSimplicity": 0.85,
            "roundnessShare": 0.3,
            "rectilinearShare": 0.7,
            "sizeNorm": 0.5,
            "priceNorm": 0.2,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.1
          }
        },
        {
          "id": "vase-001",
          "name": "Ваза напольная",
          "type": "decor",
          "dimensions": {
            "x": 0.3,
            "z": 0.3
          },
          "price": 110,
          "featureVector": {
            "woodShare": 0,
            "metalShare": 0,
            "glassShare": 0.8,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.7,
            "darkColorShare": 0.3,
            "warmPaletteShare": 0.5,
            "saturationLevel": 0.4,
            "formSimplicity": 0.7,
            "roundnessShare": 0.9,
            "rectilinearShare": 0.1,
            "sizeNorm": 0.35,
            "priceNorm": 0.12,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "clock-001",
          "name": "Часы настенные",
          "type": "decor",
          "dimensions": {
            "x": 0.4,
            "z": 0.05
          },
          "price": 95,
          "featureVector": {
            "woodShare": 0.3,
            "metalShare": 0.2,
            "glassShare": 0.3,
            "plasticShare": 0.2,
            "textileShare": 0,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.4,
            "formSimplicity": 0.8,
            "roundnessShare": 0.8,
            "rectilinearShare": 0.2,
            "sizeNorm": 0.25,
            "priceNorm": 0.1,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "sideboard-001",
          "name": "Буфет",
          "type": "storage",
          "dimensions": {
            "x": 1.5,
            "z": 0.45
          },
          "price": 520,
          "featureVector": {
            "woodShare": 0.9,
            "metalShare": 0.05,
            "glassShare": 0.1,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.8,
            "saturationLevel": 0.35,
            "formSimplicity": 0.75,
            "roundnessShare": 0.2,
            "rectilinearShare": 0.8,
            "sizeNorm": 0.75,
            "priceNorm": 0.6,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.9
          }
        },
        {
          "id": "barstool-001",
          "name": "Барный стул",
          "type": "chair",
          "dimensions": {
            "x": 0.4,
            "z": 0.4
          },
          "price": 140,
          "featureVector": {
            "woodShare": 0.5,
            "metalShare": 0.4,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.2,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.5,
            "saturationLevel": 0.45,
            "formSimplicity": 0.8,
            "roundnessShare": 0.4,
            "rectilinearShare": 0.6,
            "sizeNorm": 0.3,
            "priceNorm": 0.18,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        },
        {
          "id": "coffeetable-001",
          "name": "Столик журнальный круглый",
          "type": "table",
          "dimensions": {
            "x": 0.9,
            "z": 0.9
          },
          "price": 230,
          "featureVector": {
            "woodShare": 0.7,
            "metalShare": 0.2,
            "glassShare": 0.1,
            "plasticShare": 0,
            "textileShare": 0,
            "lightColorShare": 0.6,
            "darkColorShare": 0.4,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.4,
            "formSimplicity": 0.85,
            "roundnessShare": 0.9,
            "rectilinearShare": 0.1,
            "sizeNorm": 0.45,
            "priceNorm": 0.28,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.1
          }
        },
        {
          "id": "tvstand-001",
          "name": "Тумба под ТВ",
          "type": "storage",
          "dimensions": {
            "x": 1.6,
            "z": 0.4
          },
          "price": 340,
          "featureVector": {
            "woodShare": 0.75,
            "metalShare": 0.2,
            "glassShare": 0.05,
            "plasticShare": 0.05,
            "textileShare": 0,
            "lightColorShare": 0.4,
            "darkColorShare": 0.6,
            "warmPaletteShare": 0.6,
            "saturationLevel": 0.4,
            "formSimplicity": 0.8,
            "roundnessShare": 0.15,
            "rectilinearShare": 0.85,
            "sizeNorm": 0.7,
            "priceNorm": 0.4,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.75
          }
        },
        {
          "id": "nightstand-001",
          "name": "Прикроватная тумба",
          "type": "storage",
          "dimensions": {
            "x": 0.5,
            "z": 0.4
          },
          "price": 160,
          "featureVector": {
            "woodShare": 0.85,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.05,
            "textileShare": 0,
            "lightColorShare": 0.55,
            "darkColorShare": 0.45,
            "warmPaletteShare": 0.75,
            "saturationLevel": 0.4,
            "formSimplicity": 0.85,
            "roundnessShare": 0.2,
            "rectilinearShare": 0.8,
            "sizeNorm": 0.3,
            "priceNorm": 0.2,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0.7
          }
        },
        {
          "id": "armchair-001",
          "name": "Кресло классическое",
          "type": "chair",
          "dimensions": {
            "x": 0.9,
            "z": 0.9
          },
          "price": 420,
          "featureVector": {
            "woodShare": 0.4,
            "metalShare": 0.1,
            "glassShare": 0,
            "plasticShare": 0.1,
            "textileShare": 0.85,
            "lightColorShare": 0.5,
            "darkColorShare": 0.5,
            "warmPaletteShare": 0.7,
            "saturationLevel": 0.5,
            "formSimplicity": 0.65,
            "roundnessShare": 0.6,
            "rectilinearShare": 0.4,
            "sizeNorm": 0.55,
            "priceNorm": 0.5,
            "lightingFunctionShare": 0,
            "storageFunctionShare": 0
          }
        }
      ]
    },
    "items/item.v2.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "item.v2.json",
      "title": "Decorium Item v2 Schema",
      "description": "Schema for items in Decorium MVP with 16-field feature vectors",
      "type": "object",
      "required": [
        "items"
      ],
      "properties": {
        "items": {
          "type": "array",
          "minItems": 30,
          "items": {
            "type": "object",
            "required": [
              "id",
              "name",
              "type",
              "dimensions",
              "price",
              "featureVector"
            ],
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1,
                "pattern": "^[a-z0-9-]+$"
              },
              "name": {
                "type": "string",
                "minLength": 1
              },
              "type": {
                "type": "string",
                "enum": [
                  "chair",
                  "table",
                  "sofa",
                  "bed",
                  "storage",
                  "lighting",
                  "decor"
                ]
              },
              "dimensions": {
                "type": "object",
                "required": [
                  "x",
                  "z"
                ],
                "properties": {
                  "x": {
                    "type": "number",
                    "minimum": 0.1,
                    "maximum": 5
                  },
                  "z": {
                    "type": "number",
                    "minimum": 0.05,
                    "maximum": 5
                  }
                },
                "additionalProperties": false
              },
              "price": {
                "type": "number",
                "minimum": 0
              },
              "featureVector": {
                "type": "object",
                "required": [
                  "woodShare",
                  "metalShare",
                  "glassShare",
                  "plasticShare",
                  "textileShare",
                  "lightColorShare",
                  "darkColorShare",
                  "warmPaletteShare",
                  "saturationLevel",
                  "formSimplicity",
                  "roundnessShare",
                  "rectilinearShare",
                  "sizeNorm",
                  "priceNorm",
                  "lightingFunctionShare",
                  "storageFunctionShare"
                ],
                "properties": {
                  "woodShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "metalShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "glassShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "plasticShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "textileShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "lightColorShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "darkColorShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "warmPaletteShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "saturationLevel": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "formSimplicity": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "roundnessShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "rectilinearShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "sizeNorm": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "priceNorm": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "lightingFunctionShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "storageFunctionShare": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          }
        }
      }
    },
    "items/scandinavian-items.json": [
      {
        "id": "scand-sofa-01",
        "name": "Диван Hygge",
        "category": "sofa",
        "features": {
          "wood_share": 0.7,
          "metal_share": 0.1,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 0.9,
          "color_temperature": 0.7,
          "saturation": 0.3,
          "form_complexity": 0.2
        }
      },
      {
        "id": "scand-chair-01",
        "name": "Кресло Nord",
        "category": "chair",
        "features": {
          "wood_share": 0.8,
          "metal_share": 0,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 0.7,
          "color_temperature": 0.6,
          "saturation": 0.2,
          "form_complexity": 0.15
        }
      },
      {
        "id": "scand-table-01",
        "name": "Журнальный стол Fjord",
        "category": "table",
        "features": {
          "wood_share": 0.9,
          "metal_share": 0.05,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 0,
          "color_temperature": 0.65,
          "saturation": 0.1,
          "form_complexity": 0.1
        }
      },
      {
        "id": "scand-lamp-01",
        "name": "Торшер Aurora",
        "category": "lighting",
        "features": {
          "wood_share": 0.4,
          "metal_share": 0.5,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 0.3,
          "color_temperature": 0.8,
          "saturation": 0.1,
          "form_complexity": 0.2
        }
      },
      {
        "id": "scand-rug-01",
        "name": "Ковер Snow",
        "category": "rug",
        "features": {
          "wood_share": 0,
          "metal_share": 0,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 1,
          "color_temperature": 0.9,
          "saturation": 0.05,
          "form_complexity": 0.05
        }
      },
      {
        "id": "scand-plant-01",
        "name": "Фикус Nordic",
        "category": "plant",
        "features": {
          "wood_share": 0.3,
          "metal_share": 0,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 0,
          "color_temperature": 0.4,
          "saturation": 0.6,
          "form_complexity": 0.3
        }
      },
      {
        "id": "scand-decor-01",
        "name": "Ваза Minimal",
        "category": "decor",
        "features": {
          "wood_share": 0,
          "metal_share": 0,
          "glass_share": 0.8,
          "plastic_share": 0,
          "fabric_share": 0,
          "color_temperature": 0.3,
          "saturation": 0.1,
          "form_complexity": 0.1
        }
      },
      {
        "id": "scand-shelf-01",
        "name": "Полка Ledge",
        "category": "decor",
        "features": {
          "wood_share": 0.85,
          "metal_share": 0.1,
          "glass_share": 0,
          "plastic_share": 0,
          "fabric_share": 0,
          "color_temperature": 0.6,
          "saturation": 0.1,
          "form_complexity": 0.1
        }
      }
    ]
  },
  "levels": {
    "levels/level-001.json": {
      "id": "level-001",
      "name": "Гостиная: Первые шаги",
      "styleId": "scandinavian",
      "roomDimensions": {
        "width": 8,
        "height": 3,
        "depth": 6
      },
      "availableItems": [
        "sofa-001",
        "sofa-002",
        "chair-001",
        "chair-002",
        "table-001",
        "table-002",
        "lamp-001",
        "lamp-002",
        "shelf-001",
        "shelf-002",
        "cabinet-001",
        "desk-001",
        "plant-001",
        "mirror-001",
        "rug-001",
        "coffeetable-001"
      ],
      "initialPlacement": [],
      "targetScore": 3
    }
  },
  "schemas": {
    "schemas/constraint.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "StyleConstraint",
      "description": "Ограничение стиля: правило вида 'feature >= threshold' или 'feature <= threshold'",
      "type": "object",
      "required": [
        "id",
        "styleId",
        "feature",
        "operator",
        "threshold",
        "weight"
      ],
      "properties": {
        "id": {
          "type": "string",
          "description": "Уникальный идентификатор ограничения",
          "pattern": "^[a-z0-9-]+$"
        },
        "styleId": {
          "type": "string",
          "description": "Ссылка на стиль, к которому применяется ограничение"
        },
        "feature": {
          "type": "string",
          "enum": [
            "wood_share",
            "metal_share",
            "glass_share",
            "plastic_share",
            "fabric_share",
            "color_temperature",
            "saturation",
            "form_complexity"
          ],
          "description": "Признак, к которому применяется ограничение"
        },
        "operator": {
          "type": "string",
          "enum": [
            ">=",
            "<="
          ],
          "description": "Оператор сравнения: >= (минимум) или <= (максимум)"
        },
        "threshold": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Пороговое значение"
        },
        "weight": {
          "type": "number",
          "minimum": 0,
          "exclusiveMinimum": true,
          "description": "Вес ограничения при расчете штрафа (важность правила)"
        },
        "messageKey": {
          "type": "string",
          "description": "Ключ сообщения обратной связи для игрока при нарушении"
        }
      },
      "additionalProperties": false
    },
    "schemas/evaluation-result.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "EvaluationResult",
      "description": "Результат оценки расстановки предметов в комнате",
      "type": "object",
      "required": [
        "roomVector",
        "styleScore",
        "ergonomicsScore",
        "totalScore",
        "starRating",
        "violations",
        "feedbackMessages"
      ],
      "properties": {
        "roomVector": {
          "type": "object",
          "description": "Вычисленный вектор комнаты (среднее арифметическое векторов предметов)",
          "required": [
            "wood_share",
            "metal_share",
            "glass_share",
            "plastic_share",
            "fabric_share",
            "color_temperature",
            "saturation",
            "form_complexity"
          ],
          "properties": {
            "wood_share": {
              "type": "number"
            },
            "metal_share": {
              "type": "number"
            },
            "glass_share": {
              "type": "number"
            },
            "plastic_share": {
              "type": "number"
            },
            "fabric_share": {
              "type": "number"
            },
            "color_temperature": {
              "type": "number"
            },
            "saturation": {
              "type": "number"
            },
            "form_complexity": {
              "type": "number"
            }
          },
          "additionalProperties": false
        },
        "styleScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Оценка соответствия стилю (0 = полное несоответствие, 1 = идеальное)"
        },
        "ergonomicsScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Оценка эргономики (в MVP всегда 1.0 или заглушка)"
        },
        "totalScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Итоговая оценка (комбинация styleScore и ergonomicsScore)"
        },
        "starRating": {
          "type": "integer",
          "minimum": 0,
          "maximum": 5,
          "description": "Рейтинг в звездах для отображения игроку"
        },
        "violations": {
          "type": "array",
          "description": "Список нарушенных ограничений",
          "items": {
            "type": "object",
            "required": [
              "constraintId",
              "feature",
              "operator",
              "threshold",
              "actualValue",
              "penalty"
            ],
            "properties": {
              "constraintId": {
                "type": "string"
              },
              "feature": {
                "type": "string"
              },
              "operator": {
                "type": "string"
              },
              "threshold": {
                "type": "number"
              },
              "actualValue": {
                "type": "number"
              },
              "penalty": {
                "type": "number"
              }
            },
            "additionalProperties": false
          }
        },
        "feedbackMessages": {
          "type": "array",
          "description": "Список ID сообщений обратной связи для отображения игроку",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "schemas/feedback-message.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "FeedbackMessage",
      "description": "Сообщение обратной связи для игрока при нарушении ограничений или достижении результата",
      "type": "object",
      "required": [
        "id",
        "category",
        "template"
      ],
      "properties": {
        "id": {
          "type": "string",
          "description": "Уникальный идентификатор сообщения (совпадает с messageKey в constraint)",
          "pattern": "^[a-z0-9-]+$"
        },
        "category": {
          "type": "string",
          "enum": [
            "violation",
            "success",
            "neutral",
            "tip"
          ],
          "description": "Категория сообщения"
        },
        "template": {
          "type": "string",
          "description": "Шаблон сообщения с плейсхолдерами вида {feature}, {threshold}, {value}"
        },
        "severity": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ],
          "description": "Важность сообщения для UI"
        }
      },
      "additionalProperties": false
    },
    "schemas/item.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "ItemDefinition",
      "description": "Определение предмета интерьера с его вектором признаков для системы оценки Decorium MVP",
      "type": "object",
      "required": [
        "id",
        "name",
        "category",
        "features"
      ],
      "properties": {
        "id": {
          "type": "string",
          "description": "Уникальный идентификатор предмета",
          "pattern": "^[a-z0-9-]+$"
        },
        "name": {
          "type": "string",
          "description": "Человекочитаемое название"
        },
        "category": {
          "type": "string",
          "enum": [
            "sofa",
            "chair",
            "table",
            "lighting",
            "decor",
            "plant",
            "rug"
          ],
          "description": "Категория предмета для логики размещения"
        },
        "features": {
          "type": "object",
          "description": "Вектор признаков (Feature Vector) нормализованный [0.0, 1.0]",
          "required": [
            "wood_share",
            "metal_share",
            "glass_share",
            "plastic_share",
            "fabric_share",
            "color_temperature",
            "saturation",
            "form_complexity"
          ],
          "properties": {
            "wood_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Доля дерева в материале"
            },
            "metal_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Доля металла"
            },
            "glass_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Доля стекла"
            },
            "plastic_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Доля пластика"
            },
            "fabric_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Доля ткани"
            },
            "color_temperature": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "0 = холодный (синий/серый), 1 = теплый (желтый/коричневый)"
            },
            "saturation": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Насыщенность цвета (0 = ахроматический, 1 = яркий)"
            },
            "form_complexity": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Сложность формы (0 = минимализм/простота, 1 = барокко/декор)"
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "schemas/level.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "LevelDefinition",
      "description": "Определение уровня: комната, стиль, доступные предметы и начальное состояние",
      "type": "object",
      "required": [
        "id",
        "name",
        "styleId",
        "roomDimensions",
        "availableItems",
        "initialPlacement"
      ],
      "properties": {
        "id": {
          "type": "string",
          "description": "Уникальный идентификатор уровня",
          "pattern": "^[a-z0-9-]+$"
        },
        "name": {
          "type": "string",
          "description": "Название уровня"
        },
        "styleId": {
          "type": "string",
          "description": "Ссылка на стиль для оценки этого уровня"
        },
        "roomDimensions": {
          "type": "object",
          "description": "Размеры комнаты в метрах",
          "required": [
            "width",
            "height",
            "depth"
          ],
          "properties": {
            "width": {
              "type": "number",
              "exclusiveMinimum": 0
            },
            "height": {
              "type": "number",
              "exclusiveMinimum": 0
            },
            "depth": {
              "type": "number",
              "exclusiveMinimum": 0
            }
          },
          "additionalProperties": false
        },
        "availableItems": {
          "type": "array",
          "description": "Список ID предметов, доступных для размещения на этом уровне",
          "items": {
            "type": "string"
          },
          "minItems": 5,
          "uniqueItems": true
        },
        "initialPlacement": {
          "type": "array",
          "description": "Начальное размещение предметов (может быть пустым)",
          "items": {
            "type": "object",
            "required": [
              "itemId",
              "position",
              "rotation"
            ],
            "properties": {
              "itemId": {
                "type": "string"
              },
              "position": {
                "type": "object",
                "required": [
                  "x",
                  "y",
                  "z"
                ],
                "properties": {
                  "x": {
                    "type": "number"
                  },
                  "y": {
                    "type": "number"
                  },
                  "z": {
                    "type": "number"
                  }
                },
                "additionalProperties": false
              },
              "rotation": {
                "type": "object",
                "required": [
                  "x",
                  "y",
                  "z"
                ],
                "properties": {
                  "x": {
                    "type": "number"
                  },
                  "y": {
                    "type": "number"
                  },
                  "z": {
                    "type": "number"
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          }
        },
        "targetScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 5,
          "description": "Целевое количество звезд для прохождения уровня"
        }
      },
      "additionalProperties": false
    },
    "schemas/scoring-parameters.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "ScoringParameters",
      "type": "object",
      "required": [
        "starRatingThresholds",
        "styleWeight",
        "ergonomicsWeight",
        "maxPenalty"
      ],
      "properties": {
        "starRatingThresholds": {
          "type": "object",
          "required": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "properties": {
            "0": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "1": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "2": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "3": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "4": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "5": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            }
          },
          "additionalProperties": false
        },
        "maxPenalty": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "styleWeight": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "ergonomicsWeight": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "defaultWeight": {
          "type": "number",
          "minimum": 0
        }
      },
      "additionalProperties": true
    },
    "schemas/style.schema.json": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "StyleDefinition",
      "description": "Определение стиля интерьера с пороговыми значениями для оценки соответствия",
      "type": "object",
      "required": [
        "id",
        "name",
        "description",
        "targetVector"
      ],
      "properties": {
        "id": {
          "type": "string",
          "description": "Уникальный идентификатор стиля",
          "pattern": "^[a-z0-9-]+$"
        },
        "name": {
          "type": "string",
          "description": "Название стиля"
        },
        "description": {
          "type": "string",
          "description": "Краткое описание стиля для игрока"
        },
        "targetVector": {
          "type": "object",
          "description": "Целевой вектор признаков идеальной комнаты в этом стиле",
          "required": [
            "wood_share",
            "metal_share",
            "glass_share",
            "plastic_share",
            "fabric_share",
            "color_temperature",
            "saturation",
            "form_complexity"
          ],
          "properties": {
            "wood_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "metal_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "glass_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "plastic_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "fabric_share": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "color_temperature": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "saturation": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "form_complexity": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  },
  "scoring": {
    "scoring/scoring-parameters.json": {
      "starRatingThresholds": {
        "0": 0,
        "1": 0,
        "2": 0.4,
        "3": 0.56,
        "4": 0.71,
        "5": 0.86
      },
      "maxPenalty": 1,
      "styleWeight": 1,
      "ergonomicsWeight": 0,
      "defaultWeight": 1
    }
  },
  "styles": {
    "styles/scandinavian.json": {
      "id": "scandinavian",
      "name": "Скандинавский стиль",
      "description": "Минимализм, натуральные материалы, светлые тона и уют.",
      "targetVector": {
        "woodShare": 0.7,
        "metalShare": 0.15,
        "glassShare": 0.1,
        "plasticShare": 0,
        "textileShare": 0.5,
        "lightColorShare": 0.7,
        "darkColorShare": 0.3,
        "warmPaletteShare": 0.7,
        "saturationLevel": 0.2,
        "formSimplicity": 0.8,
        "roundnessShare": 0.4,
        "rectilinearShare": 0.6,
        "sizeNorm": 0.5,
        "priceNorm": 0.35,
        "lightingFunctionShare": 0.2,
        "storageFunctionShare": 0.4
      }
    }
  },
  "visuals": {
    "visuals/item-visuals.json": {
      "version": 1,
      "defaults": {
        "chair": "chair",
        "table": "table",
        "sofa": "sofa",
        "bed": "bed",
        "storage": "storage",
        "lighting": "tableLamp",
        "decor": "decor"
      },
      "items": {
        "table-001": {
          "shape": "diningTable",
          "material": "woodLight"
        },
        "table-002": {
          "shape": "lowTable",
          "material": "wood"
        },
        "desk-001": {
          "shape": "desk",
          "material": "woodLight"
        },
        "lamp-001": {
          "shape": "tableLamp",
          "light": {
            "color": "#ffd38c",
            "intensity": 1.8,
            "range": 3.2
          }
        },
        "lamp-002": {
          "shape": "floorLamp",
          "light": {
            "color": "#ffd38c",
            "intensity": 2.6,
            "range": 4.5
          }
        },
        "lamp-003": {
          "shape": "ceilingLamp",
          "light": {
            "color": "#fff0c2",
            "intensity": 3.2,
            "range": 6
          }
        },
        "shelf-001": {
          "shape": "wallShelf",
          "material": "woodLight"
        },
        "shelf-002": {
          "shape": "bookcase",
          "material": "wood"
        },
        "shelf-003": {
          "shape": "bookcase",
          "material": "woodLight"
        },
        "cabinet-001": {
          "shape": "cabinet",
          "material": "wood"
        },
        "tvstand-001": {
          "shape": "cabinet",
          "material": "dark"
        },
        "plant-001": {
          "shape": "plant",
          "accent": "green"
        },
        "mirror-001": {
          "shape": "mirror",
          "accent": "glass"
        },
        "rug-001": {
          "shape": "rug",
          "accent": "rug"
        },
        "coffeetable-001": {
          "shape": "roundTable",
          "material": "wood",
          "accent": "brass"
        },
        "vase-001": {
          "shape": "vase",
          "accent": "ceramic"
        },
        "clock-001": {
          "shape": "clock",
          "accent": "brass"
        }
      }
    }
  }
};
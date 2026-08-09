# Slice Card

**Slice ID:** D-001  
**Title:** FeatureVector Value Object  
**Goal:** Создать неизменяемый Value Object для представления вектора признаков предмета  
**Value:** Базовый строительный блок для системы оценки стиля. Детерминированный, тестируемый, без зависимостей.  

**Relevant docs:**
- docs/mvp/charter.md
- docs/mvp/scope.md
- docs/architecture/layers.md
- docs/systems/item-catalog.md
- data/schemas/item.schema.json

**Constraints:**
- Domain слой не должен иметь зависимостей от внешних библиотек
- FeatureVector должен быть неизменяемым (immutable)
- Все признаки нормализованы в диапазоне [0, 1]
- Поддерживаемые признаки: woodShare, metalShare, glassShare, lightColorShare, warmPaletteShare, formSimplicity, saturationLevel, plasticShare
- Конструктор должен валидировать входные данные
- Метод average() для вычисления среднего вектора из массива
- Метод dot() для скалярного произведения
- Метод toArray() для сериализации

**Acceptance criteria:**
- [ ] Конструктор принимает объект с признаками
- [ ] Конструктор бросает ошибку при недопустимых значениях (< 0 или > 1)
- [ ] Конструктор бросает ошибку при отсутствии обязательных признаков
- [ ] Признаки доступны только для чтения
- [ ] Метод average() возвращает новый FeatureVector
- [ ] Метод dot() возвращает число
- [ ] Метод toArray() возвращает_plain object
- [ ] Все тесты детерминированы и независимы

**Required tests:**
- [ ] Constructor valid input
- [ ] Constructor throws on negative value
- [ ] Constructor throws on value > 1
- [ ] Constructor throws on missing required field
- [ ] Properties are read-only (immutability)
- [ ] average() calculates correct mean vector
- [ ] average() returns new instance
- [ ] dot() calculates scalar product
- [ ] toArray() returns plain object
- [ ] equals() compares vectors

**Out of scope:**
- Сериализация в JSON
- Валидация схем JSON (это Infrastructure)
- Загрузка из файлов
- UI отображение

**Files to create:**
- src/Domain/Items/FeatureVector.js
- tests/Domain.UnitTests/Items/FeatureVector.test.js

**Files to change:**
- None (новый слайс)

**Files to delete:**
- None (будет обработано в отдельном слайсе cleanup)

**Observability:**
- Логирование ошибок валидации через console.error (для разработки)
- Trace ID в сообщениях об ошибках

**Risks:**
- Изменение списка признаков потребует изменения конструктора
- Риск нарушения immutability через прямое изменение свойств

**Rollback plan:**
- Удалить созданные файлы
- Вернуться к предыдущему коммиту

**Docs update:**
- docs/systems/item-catalog.md (обновить описание вектора)
- docs/architecture/layers.md (подтвердить размещение в Domain)

**Next action:** Создать failing test

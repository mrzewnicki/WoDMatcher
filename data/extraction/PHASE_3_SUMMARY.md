# Faza 3: Podsumowanie Ekstrakcji

## ✅ Co Zostało Wykonane

### Utworzono Mapy Referencyjne

1. **EXTRACTION_GUIDE.md** - przewodnik jak używać map referencyjnych
2. **V5_blood_sigils_rituals_reference.json** - mapa Blood Sorcery Rituals (str. 59, 99)
3. **V5_blood_sigils_alchemy_reference.json** - mapa Thin-Blood Alchemy (str. 73)
4. **V5_players_guide_oblivion_reference.json** - mapa Oblivion + Ceremonies (str. 84, 91)
5. **V5_players_guide_clans_reference.json** - mapa 7 nowych klanów (str. 17-52)

### Struktura Katalogów

```
data/
├── analysis/
│   ├── sourcebook_locations.json
│   └── ANALYSIS_REPORT.md
└── extraction/
    ├── EXTRACTION_GUIDE.md
    ├── PHASE_3_SUMMARY.md
    ├── *_reference.json (5 plików)
    └── (12 pustych plików JSON dla przyszłej pełnej ekstrakcji)
```

---

## 🎯 Co Dalej - Ręczna Ekstrakcja

### Wysoki Priorytet

**1. Oblivion Discipline** 
- Plik: `V5_players_guide_oblivion_reference.json`
- Strony: 84-90 (moce) + 91-97 (ceremonies)
- Krytyczne dla: Lasombra, Hecata

**2. Nowe Klany (7)**
- Plik: `V5_players_guide_clans_reference.json`
- Banu Haqim (str. 17)
- Hecata (str. 22) - nowy
- Lasombra (str. 29)
- Ministry (str. 35) - nowy
- Ravnos (str. 41) - nowy
- Salubri (str. 46) - nowy
- Tzimisce (str. 52) - nowy

### Średni Priorytet

**3. Blood Sorcery Rituals**
- Blood Sigils (str. 59, 99)
- Camarilla Banu Haqim (str. 168)

**4. Thin-Blood Alchemy**
- Blood Sigils (str. 73-79)

---

## 📝 Format Dodawania Danych

### Dla Dyscypliny (Oblivion)

Dodaj do nowego pliku `V5_oblivion.json`:

```json
{
  "Oblivion": {
    "book": "players-guide",
    "levels": {
      "1": {
        "power_name": {
          "name": "...",
          "cost": "...",
          "dice_pools": ["Attribute + Skill"],
          "system": "...",
          "duration": "..."
        }
      }
    }
  }
}
```

### Dla Klanu

Dodaj do `V5_players_guide_clans.json`:

```json
{
  "Clan Name": {
    "book": "players-guide",
    "disciplines": ["Disc1", "Disc2", "Disc3"],
    "bane": "Description",
    "compulsion": "Name: Description"
  }
}
```

### Dla Rytuału

Dodaj do `V5_blood_sigils_rituals.json`:

```json
{
  "ritual_name": {
    "level": 2,
    "name": "...",
    "cost": "...",
    "system": "...",
    "ingredients": "...",
    "duration": "..."
  }
}
```

---

## ⚠️ Ważne Uwagi

1. **Duplikaty**: Sprawdź czy rytuał/formuła już istnieje w `V5_disciplines.json` przed dodaniem
2. **Book ID**: Każdy wpis musi mieć `"book": "book_id"`
3. **Strony**: Możesz dodać `"page": 123` dla referencji
4. **Języki**: Sabat i Anarchisci są po polsku - nazwy mocy przetłumaczyć na angielski

---

## 🔄 Kolejne Kroki

### Teraz:
1. ✅ Faza 1 - Analiza TOC
2. ✅ Faza 2 - Struktura plików
3. ✅ Faza 3 - Mapy referencyjne

### Później (ręcznie):
4. ⏳ Ekstrakcja Oblivion
5. ⏳ Ekstrakcja 7 klanów
6. ⏳ Ekstrakcja rytuałów
7. ⏳ Aktualizacja UI aplikacji

---

## 📊 Statystyki

- **Przeanalizowane podręczniki:** 7
- **Znalezione nowe klany:** 7
- **Znalezione nowe dyscypliny:** 1 (Oblivion)
- **Lokalizacje rytuałów:** 4 źródła
- **Lokalizacje formuł:** 2 źródła
- **Utworzone pliki referencyjne:** 5
- **Całkowite pliki w extraction/:** 18

---

## ✨ Gotowe do Użycia

Wszystkie pliki referencyjne są gotowe. Możesz teraz:
- Otworzyć podręcznik na wskazanej stronie
- Ręcznie przepisać dane do plików JSON
- Zachować prawa autorskie nie kopiując pełnych opisów
- Skupić się na najważniejszych elementach (Oblivion + 7 klanów)

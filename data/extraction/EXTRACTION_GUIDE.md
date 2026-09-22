# Przewodnik Ekstrakcji Danych

## ⚠️ Ważne Informacje o Prawach Autorskich

Pliki w tym katalogu zawierają **mapy referencyjne** - wskazują GDZIE znajdują się dane w podręcznikach, ale **NIE zawierają pełnej treści**.

Ekstrakcja pełnych opisów systemów, mocy, rytuałów musi być wykonana ręcznie z zachowaniem praw autorskich.

---

## 📋 Co Zawierają Pliki Referencyjne

✅ **Zawiera:**
- Nazwy mocy/rytuałów/klanów
- Numery stron
- Poziomy dyscyplin
- Book ID i metadata
- Strukturę JSON gotową do wypełnienia

❌ **NIE zawiera:**
- Pełnych opisów systemów
- Długich fragmentów zasad
- Flavor text
- Dice pools (można dodać ręcznie później)

---

## 🔧 Jak Używać Tych Plików

### Krok 1: Otwórz Plik Referencyjny
Np. `V5_blood_sigils_rituals_reference.json`

### Krok 2: Zobacz Mapę
```json
{
  "ritual_name": {
    "page": 59,
    "level": 2,
    "book": "blood-sigils"
  }
}
```

### Krok 3: Otwórz Podręcznik
Idź do wskazanej strony w PDF

### Krok 4: Ręcznie Dodaj Dane
Przepisz:
- `cost`
- `system`
- `dice_pools`
- `duration`
- `ingredients` (dla rytuałów)

---

## 📚 Status Ekstrakcji

| Podręcznik | Reference Map | Pełne Dane | Status |
|-----------|---------------|------------|--------|
| Blood Sigils | ✅ | ⏳ | Mapa gotowa |
| Camarilla | ⏳ | ⏳ | Pending |
| Chicago | ⏳ | ⏳ | Pending |
| Player's Guide | ⏳ | ⏳ | Pending |
| Sabat | ⏳ | ⏳ | Pending |
| Anarchisci | ⏳ | ⏳ | Pending |

---

## 🎯 Priorytet Ekstrakcji

**Wysokie priorytety** (najważniejsze dla aplikacji):
1. Nowe dyscypliny (Oblivion)
2. Nowe klany (7 z Player's Guide)
3. Oblivion Ceremonies

**Średnie priorytety:**
4. Blood Sorcery Rituals (Blood Sigils, Camarilla)
5. Thin-Blood Alchemy (Blood Sigils)

**Niskie priorytety:**
6. Sabat Ceremoniały (polski)
7. Anarch clan extensions

---

## 💡 Sugestie

- Zacznij od **Oblivion** (nowa dyscyplina, krytyczna dla Lasombra)
- Potem **7 nowych klanów** z Player's Guide
- Rytuały można dodawać stopniowo
- Polskie podręczniki wymagają tłumaczenia nazw

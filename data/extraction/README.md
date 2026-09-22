# Data Extraction Files

Ten katalog zawiera puste struktury JSON gotowe do wypełnienia danymi z podręczników V5.

## Status Ekstrakcji

| Plik | Podręcznik | Status | Zawartość |
|------|-----------|--------|-----------|
| `V5_blood_sigils_rituals.json` | Blood Sigils | ⏳ Pending | Blood Sorcery Rituals (str. 59, 99) |
| `V5_blood_sigils_alchemy.json` | Blood Sigils | ⏳ Pending | Thin-Blood Alchemy Formulae (str. 73) |
| `V5_camarilla_clans.json` | Camarilla | ⏳ Pending | Banu Haqim (str. 158) |
| `V5_camarilla_rituals.json` | Camarilla | ⏳ Pending | Banu Haqim Rituals (str. 168) |
| `V5_chicago_clans.json` | Chicago by Night | ⏳ Pending | Lasombra (str. 289) |
| `V5_chicago_disciplines.json` | Chicago by Night | ⏳ Pending | Oblivion (str. 292) |
| `V5_players_guide_clans.json` | Player's Guide | ⏳ Pending | 7 nowych klanów |
| `V5_players_guide_disciplines.json` | Player's Guide | ⏳ Pending | Wszystkie dyscypliny (str. 69-103) |
| `V5_players_guide_rituals.json` | Player's Guide | ⏳ Pending | Oblivion Ceremonies + Rituals |
| `V5_sabbat_rituals.json` | Sabat (PL) | ⏳ Pending | Ceremoniały (str. 52) |
| `V5_anarch_clans.json` | Anarchisci (PL) | ⏳ Pending | Brujah, Gangreli |

## Kolejność Ekstrakcji (Faza 3)

1. **Blood Sigils** - najprostsze, czyste listy
2. **Camarilla** - Banu Haqim
3. **Chicago by Night** - Lasombra + Oblivion
4. **Player's Guide** - najwięcej treści
5. **Sabat** - ceremonie po polsku
6. **Anarchisci** - extensions klanów

## Format Danych

Wszystkie pliki używają struktury zgodnej z `V5_disciplines.json`:
- `book` - identyfikator podręcznika
- `levels` - moce pogrupowane po poziomach
- `dice_pools` - pule kości dla każdej mocy

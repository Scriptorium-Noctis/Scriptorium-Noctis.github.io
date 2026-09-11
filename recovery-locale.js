'use strict';

// Load after locale.js and before app.js.
Object.assign(window.SIGILRPG_LOCALES.pl.strings, {
  'Recovery': 'Regeneracja',
  'Second Wind': 'Drugi oddech',
  'Short Rest': 'Krótki odpoczynek',
  'Long Rest': 'Długi odpoczynek',
  'Catch your breath and clear your head. This budget restores only CON and INT.': 'Złap oddech i oczyść umysł. Ten limit przywraca wyłącznie CON i INT.',
  'Clean yourself, refresh your senses, stretch, and regain composure. This additional budget restores only AUR and SEN.': 'Oczyść się, odśwież zmysły, rozciągnij się i odzyskaj opanowanie. Ten dodatkowy limit przywraca wyłącznie AUR i SEN.',
  'Proper rest and physical care restore strength and fine control. This additional budget restores only STR and DEX.': 'Pełny odpoczynek i zadbanie o ciało przywracają siłę i precyzję ruchów. Ten dodatkowy limit przywraca wyłącznie STR i DEX.',
  'Recovery — {name}': 'Regeneracja — {name}',
  'Apply recovery': 'Zastosuj regenerację',
  'Selected character changed. Reopen recovery.': 'Wybrana postać się zmieniła. Otwórz regenerację ponownie.',
  'Dead characters cannot recover.': 'Martwe postacie nie mogą się regenerować.',
  'Invalid character state. Reopen recovery after correcting the character.': 'Nieprawidłowy stan postaci. Popraw postać i otwórz regenerację ponownie.',
  'End round first to settle pending wounds before recovery.': 'Najpierw zakończ rundę, aby rozliczyć oczekujące rany przed regeneracją.',
  'Character level changed. Reopen recovery.': 'Poziom postaci się zmienił. Otwórz regenerację ponownie.',
  'Invalid recovery stages. Reopen recovery.': 'Nieprawidłowe etapy regeneracji. Otwórz regenerację ponownie.',
  'Select Second Wind; Short Rest requires Second Wind, and Long Rest requires both.': 'Zaznacz Drugi oddech; Krótki odpoczynek wymaga Drugiego oddechu, a Długi odpoczynek wymaga obu.',
  'Recovery budgets are rounded down automatically. Reopen recovery.': 'Limity regeneracji są automatycznie zaokrąglane w dół. Otwórz regenerację ponownie.',
  'Allocate whole tiers only to eligible attributes, without exceeding their maximums.': 'Przydzielaj całe poziomy kości wyłącznie do dozwolonych atrybutów, nie przekraczając ich maksimów.',
  'A stage allocation exceeds its budget. Budgets cannot transfer.': 'Przydział etapu przekracza jego limit. Limitów nie można przenosić.',
  'Use HEAL to choose tiers to recover.': 'Użyj LECZ, aby wybrać poziomy kości do przywrócenia.',
  'Later rests include earlier stages. Each budget rounds down; unused tiers are lost, not transferred.': 'Późniejsze etapy obejmują wcześniejsze. Każdy limit zaokrągla się w dół; niewykorzystane poziomy kości przepadają i nie przechodzą na inne etapy.',
  'Recovery guidance': 'Zasady regeneracji',
  '{left}/{budget} left': 'Zostało {left}/{budget}',
  'Not selected': 'Niezaznaczone',
  '+{count} tiers': '+{count} poziomów',
  'Undo one {attribute} recovery tier': 'Cofnij przywrócenie jednego poziomu {attribute}',
  'Recovery: {total}/{budget} tiers · Unused: {waste}': 'Regeneracja: {total}/{budget} poziomów · Niewykorzystane: {waste}'
});

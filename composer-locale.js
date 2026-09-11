'use strict';

// Load after locale.js and before app.js so static text capture uses these keys.
Object.assign(window.SIGILRPG_LOCALES.pl.strings, {
  'Disarming': 'Rozbrojenie',
  'Knockback': 'Odepchnięcie',
  'Lightning': 'Błyskawica',
  'Weapon Attack ({weapon})': 'Atak bronią ({weapon})',
  'of {sources}': '— {sources}',
  'On a failed enemy Brace, the enemy drops a held item. The normal damage chain is unchanged.': 'Po nieudanym Brace przeciwnik upuszcza trzymany przedmiot. Normalny łańcuch obrażeń pozostaje bez zmian.',
  'On a failed enemy Brace, knock the target back Potential × 5 m. The normal damage chain is unchanged.': 'Po nieudanym Brace przeciwnika odepchnij cel o Potencjał × 5 m. Normalny łańcuch obrażeń pozostaje bez zmian.',
  'On a failed enemy Brace, knock the target back {meters} m (Potential × 5). The normal damage chain is unchanged.': 'Po nieudanym Brace przeciwnika odepchnij cel o {meters} m (Potencjał × 5). Normalny łańcuch obrażeń pozostaje bez zmian.',
  '1 AP · +1 potential. On a failed enemy Brace, the enemy drops a held item. The normal damage chain is unchanged.': '1 AP · +1 potencjału. Po nieudanym Brace przeciwnik upuszcza trzymany przedmiot. Normalny łańcuch obrażeń pozostaje bez zmian.',
  '1 AP · +1 potential. On a failed enemy Brace, knock the target back Potential × 5 m. The normal damage chain is unchanged.': '1 AP · +1 potencjału. Po nieudanym Brace przeciwnika odepchnij cel o Potencjał × 5 m. Normalny łańcuch obrażeń pozostaje bez zmian.',
  'Attack-like Shapes replace Basic Attack: no base AP/potential, weapon accuracy/Impact, or Smite discount.': 'Kształty działające jak atak zastępują atak podstawowy: bez jego AP/potencjału, celności/Impaktu broni ani zniżki Smite.',
  'Remove the last attack-like Shape to restore your saved Basic Attack: on.': 'Usuń ostatni Kształt działający jak atak, aby przywrócić zapisane ustawienie ataku podstawowego: włączony.',
  'Remove the last attack-like Shape to restore your saved Basic Attack: off.': 'Usuń ostatni Kształt działający jak atak, aby przywrócić zapisane ustawienie ataku podstawowego: wyłączony.',
  'Basic Attack preference is remembered while attack-like Shapes replace it.': 'Ustawienie ataku podstawowego jest zapamiętane, gdy zastępują go Kształty działające jak atak.',
  'For other standalone spells, turn Basic Attack off. Removing the last attack-like Shape restores your saved Basic Attack preference.': 'Dla innych samodzielnych zaklęć wyłącz atak podstawowy. Usunięcie ostatniego Kształtu działającego jak atak przywraca zapisane ustawienie ataku podstawowego.',
  'Only a single Source with Basic Attack and no other Glyphs gets the Smite AP exception. Multiple Sources each cost 1 AP.': 'Wyjątek AP dla Smite dotyczy tylko jednego Źródła z atakiem podstawowym, bez innych Glifów. Przy wielu Źródłach każde kosztuje 1 AP.',
  'An action can use only one Source Glyph. A single Source with Basic Attack and no other Glyphs gets the Smite AP exception.': 'Jedna akcja może używać tylko jednego Glify Źródła. Pojedyncze Źródło z Atakiem podstawowym i bez innych Glifów otrzymuje wyjątek AP dla Smite.',
  'Multiple Sources in a weapon or unarmed combination each cost 1 AP; slash-separated names do not grant a Smite discount.': 'W połączeniu z atakiem bronią lub bez broni każde z wielu Źródeł kosztuje 1 AP; nazwy oddzielone ukośnikiem nie dają zniżki Smite.',
  'Names use readable localized components in fixed order; weapon Sources are slash-separated. Alternative incantations use invented short prefix words as tracker flavor, not canonical rules.': 'Nazwy składają się z czytelnych, przetłumaczonych elementów w stałej kolejności; Źródła ataku bronią są rozdzielane ukośnikiem. Alternatywne inkantacje używają wymyślonych krótkich słów prefiksowych wyłącznie jako urozmaicenia pomocnika, a nie kanonicznych zasad.',
  'Alternative incantation (tracker flavor, not canonical): {name}': 'Alternatywna inkantacja (urozmaicenie pomocnika, nie kanon): {name}',
  'Precision + Lightning + Fire + Bolt = 4 AP, with no Basic Attack.': 'Precyzja + Błyskawica + Ogień + Pocisk = 4 AP, bez ataku podstawowego.',
  'Weapon for Basic Attack': 'Broń do ataku podstawowego',
  'Include weapon or unarmed attack · 1 AP · 2 potential': 'Dodaj atak bronią lub bez broni · 1 AP · 2 potencjału',
  'Attack prefixes': 'Prefiksy ataku',
  'Clear prefixes and words': 'Wyczyść prefiksy i słowa',
  'Prefixes modify a Basic Attack or an attack-like Shape.': 'Prefiksy modyfikują atak podstawowy lub Kształt działający jak atak.',
  'Choose an attack for these prefixes': 'Wybierz atak dla tych prefiksów',
  'Prefixes need a Basic Attack or an attack-like Shape. Add one, or remove the prefixes; no totals are shown until then.': 'Prefiksy wymagają ataku podstawowego lub Kształtu działającego jak atak. Dodaj go albo usuń prefiksy; do tego czasu podsumowanie nie jest wyświetlane.',
  'Compose a spell or add a Source Smite': 'Ułóż zaklęcie lub dodaj Smite Źródła',
  'For a spell without a weapon attack, turn Basic Attack off. Attack-like Shapes can use prefixes; they are not Source Smites.': 'Aby ułożyć zaklęcie bez ataku bronią, wyłącz Atak podstawowy. Kształty działające jak atak mogą korzystać z prefiksów; nie są Smite ze Źródła.',
  'Glyph effects are working drafts. Shape combinations depend on the fiction and table agreement; this composer does not decide their compatibility.': 'Efekty Glifów są wersjami roboczymi. Łączenie Kształtów zależy od sytuacji i ustaleń przy stole; kreator nie rozstrzyga ich zgodności.',
  'Result · Tracker ruling, not canonical': 'Wynik · rozstrzygnięcie pomocnika, nie kanon',
  '—': '—',
  'Delivery': 'Dostarczenie',
  'Targets / Area': 'Cele / obszar',
  'Resolution': 'Rozstrzygnięcie',
  'Source effects': 'Efekty Źródeł',
  'Shape interactions': 'Interakcje Kształtów',
  'Mastery': 'Mistrzostwo',
  'Diagnostics': 'Diagnostyka',
  'Tracker ruling: each Mana or Dust spent adds +1 potential; Shape delivery is layered and area resistance uses total selected Glyph count.': 'Rozstrzygnięcie pomocnika: każdy wydany punkt Many lub Pyłu dodaje +1 potencjału; sposoby działania Kształtów nakładają się warstwowo, a opór obszarowy zależy od łącznej liczby wybranych Glifów.',
  'No energy': 'Bez energii',
  'Area resistance': 'Opór obszarowy',
  'Tracker ruling.': 'Rozstrzygnięcie pomocnika.',
  'Duration': 'Czas trwania',
  'Weapon or unarmed hit carries the selected Sources.': 'Trafienie bronią lub bez broni przenosi wybrane Źródła.',
  'One attack target; weapon range applies.': 'Jeden cel ataku; obowiązuje zasięg broni.',
  'Roll weapon accuracy. Source Smite is part of that hit.': 'Wykonaj rzut celności broni. Smite Źródła jest częścią tego trafienia.',
  'Power Glyph delivers the payload through hearing.': 'Glif Mocy dostarcza efekt przez słuch.',
  'Anything that can hear within audible reach; compatible Shapes manifest on each listener.': 'Wszystko, co słyszy w zasięgu dźwięku; zgodne Kształty objawiają się przy każdym słuchaczu.',
  'Targets use area resistance; no spell-accuracy roll unless a carried primary Shape specifically attacks one target.': 'Cele używają oporu obszarowego; bez rzutu celności zaklęcia, chyba że przenoszony Kształt główny atakuje konkretny cel.',
  'Area/container Shapes place the payload directly; no attack roll.': 'Kształty obszarowe/pojemniki umieszczają efekt bezpośrednio; bez rzutu ataku.',
  'Somatic touch delivers an unshaped Source Glyph or utility Mastery Glyph.': 'Dotyk somatyczny dostarcza nieukształtowane Źródło lub Glif użytkowy.',
  'One touched target.': 'Jeden dotknięty cel.',
  'Willing target: no roll. Harmful use follows target defense or resistance as agreed at the table.': 'Chętny cel: bez rzutu. Szkodliwe użycie podlega obronie lub oporowi celu zgodnie z ustaleniem stołu.',
  'Roll spell accuracy against the primary target’s defense.': 'Wykonaj rzut celności zaklęcia przeciw obronie głównego celu.',
  'Caster casting check: none (fewer than 3 energy spent).': 'Test rzucania zaklęcia: brak (wydano mniej niż 3 punkty energii).',
  'Caster casting check': 'Test rzucania zaklęcia',
  'Tracker ruling: potential = base {base} + prefixes {prefixes} + Mana {mana} + Dust {dust} = {total}.': 'Rozstrzygnięcie pomocnika: potencjał = baza {base} + prefiksy {prefixes} + Mana {mana} + Pył {dust} = {total}.',
  'Competing primary delivery Shapes: {selected}. Tracker ruling: {winner} wins by stable catalog priority; the others modify the endpoint only where their interaction permits.': 'Konkurujące główne Kształty działania: {selected}. Rozstrzygnięcie pomocnika: {winner} ma pierwszeństwo zgodnie ze stałą kolejnością katalogu; pozostałe modyfikują efekt końcowy tylko tam, gdzie pozwala na to ich interakcja.',
  '{shape} requires another Shape to modify.': '{shape} wymaga innego Kształtu do modyfikacji.',
  'Echoes requires an identifiable earlier spell trace; choose one at the table.': 'Echa wymagają rozpoznawalnego śladu wcześniejszego zaklęcia; wybierz go przy stole.',
  'Weapon or unarmed Attack carries Source Glyphs cleanly, but not Shaping Glyphs: {shapes} still need their own spell delivery. Shown as a warning, not blocked.': 'Atak bronią lub bez broni czysto przenosi Glify Źródeł, ale nie Glify Kształtowania: {shapes} nadal potrzebują własnego dostarczenia zaklęcia. Pokazane jako ostrzeżenie, nie blokada.',
  'Weapon or unarmed Attack carries Source Glyphs cleanly, but not Mastery Glyphs: {mastery} does not act through the weapon hit. Shown as a warning, not blocked.': 'Atak bronią lub bez broni czysto przenosi Glify Źródeł, ale nie Glify Mistrzostwa: {mastery} nie działa przez trafienie bronią. Pokazane jako ostrzeżenie, nie blokada.'
});

// Composer-specific display metadata. Rules stay in app.js; this layer owns localized,
// human-readable names and grammatical forms used when assembling action names.
window.SIGILRPG_LOCALES.en.composer = {
  attackMastery: Object.fromEntries([
    ['precision','Precision'],['power','Power'],['dashing','Dashing'],['disarming','Disarming'],['knockback','Knockback'],['sweep','Sweep']
  ].map(([id,label])=>[id,{label,name:label}])),
  glyphs: {}
};

window.SIGILRPG_LOCALES.pl.composer = {
  attackMastery: {
    precision:{label:'Precyzja',name:'Precyzyjny'},
    power:{label:'Potęga',name:'Potężny'},
    dashing:{label:'Szarża',name:'Szarża'},
    disarming:{label:'Rozbrojenie',name:'Rozbrajający'},
    knockback:{label:'Odrzut',name:'Odpychający'},
    sweep:{label:'Zamach',name:'Zamach'}
  },
  glyphs: {
    thunder:{label:'Błyskawica',actionName:'Błyskawica',sourceName:'Błyskawicy'},
    vital:{label:'Energia życiowa',actionName:'Energia życiowa',sourceName:'Energii życiowej'},
    force:{label:'Siła',actionName:'Siła',sourceName:'Siły'},
    fire:{label:'Ogień',actionName:'Ogień',sourceName:'Ognia'},
    frost:{label:'Mróz',actionName:'Mróz',sourceName:'Mrozu'},
    echoes:{label:'Echa',actionName:'Echa',sourceName:'Ech'},
    shadow:{label:'Cień i ciemność',actionName:'Cień',sourceName:'Cienia'},
    light:{label:'Światło i blask',actionName:'Światło',sourceName:'Światła'},
    poison:{label:'Trucizna',actionName:'Trucizna',sourceName:'Trucizny'},
    fear:{label:'Strach',actionName:'Strach',sourceName:'Strachu'},
    water:{label:'Woda',actionName:'Woda',sourceName:'Wody'},
    speed:{label:'Szybkość',actionName:'Szybkość',sourceName:'Szybkości'},
    levitate:{label:'Lewitacja',actionName:'Lewitacja',sourceName:'Lewitacji'},
    stone:{label:'Kamień',actionName:'Kamień',sourceName:'Kamienia'},

    pillar:{label:'Filar',actionName:'Filar',sourceName:'Filaru'},
    bolt:{label:'Pocisk',actionName:'Pocisk',sourceName:'Pocisku'},
    vortex:{label:'Wir',actionName:'Wir',sourceName:'Wiru'},
    hammer:{label:'Młot',actionName:'Młot',sourceName:'Młota'},
    strike:{label:'Uderzenie',actionName:'Uderzenie',sourceName:'Uderzenia'},
    slash:{label:'Cięcie',actionName:'Cięcie',sourceName:'Cięcia'},
    snake:{label:'Wąż',actionName:'Wąż',sourceName:'Węża'},
    knockdown:{label:'Powalenie / przyszpilenie',actionName:'Powalenie',sourceName:'Powalenia'},
    chains:{label:'Łańcuchy / skrępowanie',actionName:'Łańcuchy',sourceName:'Łańcuchów'},
    barrier:{label:'Bariera / tarcza',actionName:'Bariera',sourceName:'Bariery'},
    siphon:{label:'Syfon / drenaż',actionName:'Drenaż',sourceName:'Drenażu'},
    construct:{label:'Konstrukt / szkielet',actionName:'Konstrukt',sourceName:'Konstruktu'},
    heart:{label:'Serce / centrum',actionName:'Serce',sourceName:'Serca'},
    illusion:{label:'Iluzja / zasłona',actionName:'Iluzja',sourceName:'Iluzji'},
    wings:{label:'Skrzydła / lot',actionName:'Skrzydła',sourceName:'Skrzydeł'},
    shatter:{label:'Roztrzaskanie',actionName:'Roztrzaskanie',sourceName:'Roztrzaskania'},
    howling:{label:'Wycie',actionName:'Wycie',sourceName:'Wycia'},
    open:{label:'Otwarcie',actionName:'Otwarcie',sourceName:'Otwarcia'},
    spiral:{label:'Spirala',actionName:'Spirala',sourceName:'Spirali'},
    cave:{label:'Jaskinia / tunel',actionName:'Tunel',sourceName:'Tunelu'},
    flat:{label:'Płaszczyzna',actionName:'Płaszczyzna',sourceName:'Płaszczyzny'},

    negation:{label:'Negacja',actionName:'Negacja',sourceName:'Negacji'},
    power:{label:'Słowo Mocy',actionName:'Słowo Mocy',sourceName:'Słowa Mocy'},
    focus:{label:'Glif Skupienia',actionName:'Skupienie',sourceName:'Skupienia'},
    enhancement:{label:'Wzmocnienie',actionName:'Wzmocnienie',sourceName:'Wzmocnienia'},
    ascended:{label:'Wyniesiona energia',actionName:'Wyniesienie',sourceName:'Wyniesienia'},
    hold:{label:'Nie ruszaj się',actionName:'Nie ruszaj się',sourceName:'Unieruchomienia'},
    show:{label:'Pokaż mi',actionName:'Pokaż mi',sourceName:'Objawienia'},
    multiplier:{label:'Mnożnik',actionName:'Mnożnik',sourceName:'Mnożnika'}
  },
  composeName({attackMasteryKeys,sources,shapes,mastery,hasBaseAttack,usesFocus,weapon,attackMasteryDisplay,glyphDisplay}) {
    const parts=attackMasteryKeys.map(key=>attackMasteryDisplay(key,'name'));
    if(hasBaseAttack){
      parts.push(weapon?`Atak (${weapon.name})`:'Atak');
      if(sources.length)parts.push(sources.map(glyph=>glyphDisplay(glyph,'sourceName')).join(' / '));
      parts.push(...shapes.map(glyph=>glyphDisplay(glyph,'actionName')),...mastery.map(glyph=>glyphDisplay(glyph,'actionName')));
      return parts.join(' ');
    }
    const attackShape=shapes.find(glyph=>glyph.delivery==='primary-attack');
    if(attackShape){
      parts.push(glyphDisplay(attackShape,'actionName'));
      if(sources.length)parts.push(sources.map(glyph=>glyphDisplay(glyph,'sourceName')).join(' / '));
      parts.push(...shapes.filter(glyph=>glyph!==attackShape).map(glyph=>glyphDisplay(glyph,'actionName')),...mastery.map(glyph=>glyphDisplay(glyph,'actionName')));
    }else{
      parts.push(...shapes.map(glyph=>glyphDisplay(glyph,'actionName')));
      if(sources.length)parts.push(sources.map(glyph=>glyphDisplay(glyph,shapes.length?'sourceName':'actionName')).join(' / '));
      parts.push(...mastery.map(glyph=>glyphDisplay(glyph,'actionName')));
    }
    return parts.join(' ');
  }
};

Object.assign(window.SIGILRPG_LOCALES.pl.strings, {
  'Basic Attack cannot be combined with Shaping Glyphs. Turn off Basic Attack or remove the Shapes.': 'Ataku podstawowego nie można łączyć ze Glifymi Kształtu. Wyłącz Atak podstawowy albo usuń Kształty.',
  'Shaping Glyphs cannot be combined with Basic Attack. Turn Basic Attack off before composing a spell with Shapes.': 'Glifów Kształtowania nie można łączyć z Atakiem podstawowym. Wyłącz Atak podstawowy przed komponowaniem zaklęcia z Kształtami.',
  'Basic Attack is an explicit selection. Adding or removing Shapes does not change it automatically.': 'Atak podstawowy jest wybierany jawnie. Dodawanie ani usuwanie Kształtów nie zmienia tego ustawienia automatycznie.',
  'Choose only one Source Glyph per action.': 'Wybierz tylko jedno Glif Źródła dla jednej akcji.',
  'Basic Attack is selected together with Shaping Glyphs. This composition is invalid until one side is removed.': 'Atak podstawowy jest wybrany razem ze Glifymi Kształtu. Ta kompozycja jest nieprawidłowa, dopóki nie usuniesz jednej z tych części.',
  'Attack-like Shapes can use attack prefixes, but must be composed without Basic Attack.': 'Kształty działające jak atak mogą używać prefiksów ataku, ale muszą być komponowane bez Ataku podstawowego.',
  'Basic Attack can carry one Source Glyph. Shaping Glyphs require a standalone spell.': 'Atak podstawowy może przenosić jedno Glif Źródła. Glify Kształtowania wymagają osobnego zaklęcia.',
  'Names use localized composer metadata. Incantations are selected from spelling variants stored with each Mastery Glyph and Glyph.': 'Nazwy korzystają z metadanych językowych kreatora. Inkantacje są losowane z wariantów zapisu przypisanych do każdego prefiksu i Glify.'
});


Object.assign(window.SIGILRPG_LOCALES.pl.strings, {
  'Weapon / focus': 'Broń / fokus',
  'Weapon use': 'Sposób użycia broni',
  'Basic Attack': 'Atak podstawowy',
  'Use weapon to hit · 1 AP · 2 potential': 'Użyj broni do trafienia · 1 AP · 2 potencjału',
  'Use as Focus': 'Użyj jako fokus',
  'Keep weapon in the fiction; ignore its physical stats': 'Broń pozostaje elementem fikcji; zignoruj jej fizyczne statystyki',
  'Basic Attack uses weapon Accuracy and Impact. Use as Focus does not.': 'Atak podstawowy używa Celności i Impaktu broni. Tryb fokusu je ignoruje.',
  'Attack Mastery Glyphs': 'Glify Mistrzostwa Ataku',
  'Clear Mastery and Glyphs': 'Wyczyść Mistrzostwo i Glify',
  'These Mastery Glyphs modify a Basic Attack or an attack-like Shaping Glyph.': 'Te Glify Mistrzostwa modyfikują Atak podstawowy albo Glif Kształtowania działający jak atak.',
  'Source Glyph effects': 'Efekty Glifów Źródła',
  'Shaping Glyph interactions': 'Interakcje Glifów Kształtowania',
  'Mastery Glyphs': 'Glify Mistrzostwa',
  'Glyphs': 'Glify',
  'Build magic, martial techniques, rituals, and utility actions': 'Twórz magię, techniki walki, rytuały i akcje użytkowe',
  'Shaping Glyphs cannot be combined with Basic Attack. Choose Use as Focus when the weapon is only part of the casting fiction.': 'Glifów Kształtowania nie można łączyć z Atakiem podstawowym. Wybierz Użyj jako fokus, gdy broń jest tylko elementem fikcji rzucania.',
  'Basic Attack and Use as Focus are explicit, mutually exclusive weapon modes.': 'Atak podstawowy i Użyj jako fokus to jawne, wzajemnie wykluczające się tryby użycia broni.',
  'Spells may combine multiple Source Glyphs. A Basic Attack can carry only one Source Glyph; that Source becomes Smite, consumes Mana, and adds no AP.': 'Zaklęcia mogą łączyć wiele Glifów Źródła. Atak podstawowy może przenieść tylko jeden; staje się on Smite, zużywa Manę i nie dodaje AP.',
  'Glyph metadata supplies localized names, grammatical forms, descriptions, and alternate incantation spellings.': 'Metadane Glifów dostarczają lokalizowanych nazw, form gramatycznych, opisów i alternatywnych zapisów inkantacji.',
  'Tracker ruling: each Mana or Dust spent adds +1 potential; Shaping Glyph delivery is layered and area resistance uses total selected Glyph count.': 'Rozstrzygnięcie pomocnika: każdy wydany punkt Many lub Pyłu dodaje +1 potencjału; dostarczanie Glifów Kształtowania jest warstwowe, a opór obszarowy używa łącznej liczby wybranych Glifów.',
  'Clear Glyphs': 'Wyczyść Glify',
  'Mastery Glyphs modify one attack': 'Glify Mistrzostwa modyfikują jeden atak',
  'Attack Mastery Glyphs are not separate attacks. Three Basic Attacks are three independent accuracy rolls and three independent damage chains.': 'Glify Mistrzostwa Ataku nie są osobnymi atakami. Trzy Ataki podstawowe to trzy niezależne rzuty Celności i trzy niezależne łańcuchy obrażeń.',
  'Basic Attack cannot be combined with Shaping Glyphs. Choose Use as Focus or remove the Shaping Glyphs.': 'Ataku podstawowego nie można łączyć z Glifami Kształtowania. Wybierz Użyj jako fokus albo usuń Glify Kształtowania.',
  'A Basic Attack can carry only one Source Glyph. Spells may combine multiple Source Glyphs.': 'Atak podstawowy może przenieść tylko jeden Glif Źródła. Zaklęcia mogą łączyć wiele Glifów Źródła.',
  'These Mastery Glyphs need a Basic Attack or an attack-like Shaping Glyph.': 'Te Glify Mistrzostwa wymagają Ataku podstawowego albo Glifu Kształtowania działającego jak atak.',
  'Choose an attack for these Mastery Glyphs': 'Wybierz atak dla tych Glifów Mistrzostwa',
  'Basic Attack uses the selected weapon to hit: weapon Accuracy and Impact apply. One Source Glyph may ride the hit as Smite for Mana but no additional AP.': 'Atak podstawowy używa wybranej broni do trafienia: obowiązują Celność i Impakt broni. Jeden Glif Źródła może zostać przeniesiony jako Smite za Manę, bez dodatkowego AP.',
  'Use as Focus keeps the weapon in the fiction of the action but ignores its physical Accuracy and Impact.': 'Użyj jako fokus zachowuje broń w fikcji akcji, ale ignoruje jej fizyczną Celność i Impakt.',
  'Source Smite consumes Mana but adds no AP.': 'Smite Źródła zużywa Manę, ale nie dodaje AP.',
  'Tracker ruling: potential = base {base} + Mastery Glyphs {mastery} + Mana {mana} + Dust {dust} = {total}.': 'Rozstrzygnięcie pomocnika: potencjał = baza {base} + Glify Mistrzostwa {mastery} + Mana {mana} + Pył {dust} = {total}.',
  'Competing primary delivery Shaping Glyphs: {selected}. Tracker ruling: {winner} wins by stable catalog priority; the others modify the endpoint only where their interaction permits.': 'Konkurujące główne Glify Kształtowania: {selected}. Rozstrzygnięcie pomocnika: {winner} ma pierwszeństwo według stałej kolejności katalogu; pozostałe modyfikują punkt końcowy tylko tam, gdzie pozwala na to ich interakcja.',
  '{shape} requires another Shaping Glyph to modify.': '{shape} wymaga innego Glifu Kształtowania do modyfikacji.',
  'A Basic Attack carries one Source Glyph as Smite; other Mastery Glyphs do not automatically act through the weapon hit.': 'Atak podstawowy przenosi jeden Glif Źródła jako Smite; pozostałe Glify Mistrzostwa nie działają automatycznie przez trafienie bronią.',
  'Weapon or unarmed hit carries the selected Source Glyph as Smite.': 'Trafienie bronią lub bez broni przenosi wybrany Glif Źródła jako Smite.',
  'The hearing Mastery Glyph delivers the payload through sound.': 'Glif Mistrzostwa oparty na słuchu dostarcza efekt przez dźwięk.',
  'Anything that can hear within audible reach; compatible Shaping Glyphs manifest on each listener.': 'Wszystko, co słyszy w zasięgu dźwięku; zgodne Glify Kształtowania manifestują się na każdym słuchaczu.',
  'Targets use area resistance; no spell-accuracy roll unless a carried primary Shaping Glyph specifically attacks one target.': 'Cele używają oporu obszarowego; bez rzutu Celności zaklęcia, chyba że przenoszony główny Glif Kształtowania atakuje konkretny cel.',
  'Area/container Shaping Glyphs place the payload directly; no attack roll.': 'Obszarowe/pojemnikowe Glify Kształtowania umieszczają efekt bezpośrednio; bez rzutu ataku.',
  'Each affected target makes area resistance at {difficulty} {dc}. Resistance difficulty uses total selected Glyph count ({count}), not AP or Mastery Glyph count.': 'Każdy objęty cel wykonuje opór obszarowy przeciw {difficulty} {dc}. Trudność używa łącznej liczby wybranych Glifów ({count}), a nie AP ani liczby Glifów Mistrzostwa.',
  'Somatic touch delivers an unshaped Source Glyph or utility Mastery Glyph.': 'Dotyk somatyczny dostarcza nieukształtowany Glif Źródła albo użytkowy Glif Mistrzostwa.',
  'The selected weapon is an arcane focus only; its Accuracy and Impact are ignored.': 'Wybrana broń jest wyłącznie fokusem; jej Celność i Impakt są ignorowane.',
  'through {weapon}': 'przez {weapon}',
  'Mastery Glyphs': 'Glify Mistrzostwa',
  'Mastery Glyphs represent trained techniques. Some modify attacks; others modify magic, searching, scrying, or other actions.': 'Glify Mistrzostwa reprezentują wyuczone techniki. Niektóre modyfikują ataki, inne magię, poszukiwanie, wróżenie lub inne akcje.',
  'Attack-related Mastery Glyph. Requires a Basic Attack or an attack-like Shaping Glyph.': 'Glif Mistrzostwa związany z atakiem. Wymaga Ataku podstawowego albo Glifu Kształtowania działającego jak atak.',
  'General Mastery Glyph. It may modify magic, utility, searching, scrying, or another compatible action.': 'Ogólny Glif Mistrzostwa. Może modyfikować magię, działania użytkowe, poszukiwanie, wróżenie lub inną zgodną akcję.',
  'Clear Source / Shaping Glyphs': 'Wyczyść Glify Źródła / Kształtowania',
  'Mastery, Source, and Shaping Glyphs use one shared palette.': 'Glify Mistrzostwa, Źródła i Kształtowania korzystają z jednej wspólnej palety.',
  'Mastery · Source · Shaping': 'Mistrzostwo · Źródło · Kształtowanie',
  'AP only': 'Tylko AP',
  'Unavailable': 'Niedostępne',
  '1 Mana': '1 Mana',
  '1 Dust': '1 Pył',
  'Source Glyphs': 'Glify Źródła',
  'Shaping Glyphs': 'Glify Kształtowania',
  'Shield': 'Tarcza',
  '+ Shield': '+ Tarcza',
  'Remove shield': 'Usuń tarczę',
  'Offhand': 'Druga ręka',
  'Slot': 'Miejsce',
  'Missed melee': 'Chybienie w zwarciu',
  'Ignore chip damage': 'Ignoruj obrażenia odpryskowe',
  'Ranged Dodge guarantee': 'Gwarancja Uniku przeciw dystansowym',
  'Ignore chip damage on a missed melee attack; Dodge vs ranged attacks is guaranteed at least 4.': 'Ignoruj obrażenia odpryskowe po chybieniu w zwarciu; Unik przeciw atakom dystansowym ma gwarancję co najmniej 4.'
});


Object.assign(window.SIGILRPG_LOCALES.pl.strings, {
  'STR or DEX, whichever is higher': 'STR albo DEX, zależnie od tego, który jest wyższy',
  'Unarmed attack: no Impact value; use Accuracy and Potential.': 'Atak bez broni nie ma wartości Impaktu; używa Celności i Potencjału.',
  'Potential breakdown: {parts} = {total}.': 'Rozpiska Potencjału: {parts} = {total}.',
  '{condition}: {glyph} contributes {value} potential instead of {normal}; total potential {total}.': '{condition}: {glyph} wnosi {value} Potencjału zamiast {normal}; łączny Potencjał {total}.',
  'Against undead': 'przeciw nieumarłym',
  'Focused application': 'Skupione zastosowanie',
  'This Mastery Glyph affects spell difficulty and is not available during a Basic Attack.': 'Ten Glif Mistrzostwa wpływa na trudność zaklęcia i jest niedostępny podczas Ataku podstawowego.'
});

Object.assign(window.SIGILRPG_LOCALES.pl.strings, {
  'Mana or Dust adds +1 potential by default, but Glyph metadata may add bonuses or mode/target-specific overrides. Shaping Glyph delivery is layered and area resistance uses total selected Glyph count.': 'Mana lub Pył domyślnie dodaje +1 Potencjału, ale metadane Glifu mogą dodać premie albo nadpisać tę wartość zależnie od sposobu użycia lub celu. Działanie Glifów Kształtowania jest warstwowe, a opór obszarowy zależy od łącznej liczby wybranych Glifów.',
  'Precision + Lightning + Fire + Bolt = 4 AP while using the weapon as Focus or no weapon at all; Bolt contributes an extra +1 potential for focused application.': 'Precyzja + Błyskawica + Ogień + Pocisk = 4 AP przy użyciu broni jako fokusu albo bez broni; Pocisk dodaje dodatkowe +1 Potencjału za skupione zastosowanie.'
});

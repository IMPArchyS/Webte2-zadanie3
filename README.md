# WEBTE2 Zadanie č.3 LS 2023/2024
## 1. Všeobecné pokyny 
- Zadania by mali byť optimalizované pre posledné verzie Google Chrome a Firefox
- Zadania sa odovzdávajú vždy do polnoci dňa, ktorý predchádza cvičeniu.
- Neskoré odovzdanie zadania sa trestá znížením počtu bodov.
- Pre každé zadanie si vytvorte novú databázu (t.j. nemiešajte spolu databázy z rôznych úloh, pokiaľ to v úlohe nebude vyslovene uvedené).
- Je potrebné odovzdať:<br>
  (1) zazipované zadanie aj s nadradeným adresárom (t.j. nie 7zip, RAR, ani žiadny iný formát). Názov ZIP archívu musí byť v tvare idStudenta_priezvisko_z3.zip. Úvodný skript nazvite index.php. Konfiguračný súbor nazvite config.php a umiestnite ho do rovnakého adresára, v ktorom máte umiestnený index.php. Do poznámky priložte linku na funkčné zadanie umiestnené na vašom pridelenom serveri 147.175.105.XX (nodeXX.webte.fei.stuba.sk).<br>
Príklad štruktúry odovzdaného zadania:<br>
12345_mrkvicka_z2.zip:<br>
12345_mrkvicka_z2/<br>
index.php<br>
config.php<br>
12345_mrkvicka_z2.sql (v prípade práce s databázou)<br>
12345_mrkvicka_z2.doc (len v prípade odovzdanej technickej správy)<br>
(2) súbor docker compose<br>
(3) technickú správu<br>
(4) adresu umiestnenia na školskom serveri (uvedte do poznámky v MS Teams).<br>
- V prípade zistenia plagiátorstva je treba počítať s následkami.
## 2. Zadanie cvičenia:
Využitím websocketov vytvorte online hru pre dvoch hráčov, ktorá je inšpirovaná hrou paper.io (https://games.voodoo.io/paperio2).

  (1) Každý hráč bude môcť pohybovať svojim kurzorom (v tvare štvorca) po hracej ploche (pomocou myši alebo šípkových kláves), pričom kurzor bude na ploche zanechávať stopu. Cieľom je uzavrieť svoju stopu do uzavretej plochy. Keď uzavriete plochu, tak sa vyfarbí vašou farbou a stane sa vaším územím.
  
  (2) Druhý hráč robí to isté. Je možné, aby ste zabrali aj súperove územie.
  
  (3) Súpera môžete zničiť tak, že prejdete cez jeho stopu, ktorá ešte nebola uzavretá do plochy.
  
  (4) Počas hry sa vám na hracej ploche môžu náhodne zobraziť body vašej aj súperovej farby (voľte o niečo tmavší odtieň ako používate na kreslenie stopy a vyfarbovanie plochy, aby tieto body bolo vidieť). Vždy sa zobrazí naraz rovnaký počet bodov pre vás a pre súpera.
  
  (5) Ak ohraničíte svojou stopou bod súpera, tak posledná ňím ohraničená plocha sa zruší. Ak ohraničíte svoj bod, tak zmizne z obrazovky a ochránite ho tým pred súperom.
  
  (6) Hra skončí buď zničením súpera alebo uplynutím časového intervalu, ktorý bol zvolený v sekundách pred spustením hry.
  
  (7) Ak hra skončí uplynutím časového intervalu určíte víťaza na základe toho, kto zabral väčšie územie. Nezabudnite na to, že grafický vzhľad aplikácie tiež predáva.

## Wstępny Plan Aplikacji: Konfigurator Układu Szuflad 3D

### 1. Cel Aplikacji

Stworzenie interaktywnej aplikacji webowej (Single Page Application), która pozwoli użytkownikom na zaprojektowanie układu pudełek (wkładów) do szuflad na bazie siatki modułowej 16mm. Użytkownik definiuje wymiary swojej szuflady, układa pudełka, a następnie otrzymuje wycenę oraz generuje kod konfiguracji lub plik PDF, który służy do złożenia zamówienia w sklepie zewnętrznym.

### 2. Proponowana Architektura i Technologie

- **Frontend Framework**: **Angular**.
- **Renderowanie 3D**: **Three.js**.
- **Zarządzanie Stanem**: **Angular Signal** (przechowywanie konfiguracji szuflady, listy pudełek, logiki wyceny).
- **UI**: **PrimeNG**. Nowoczesna, dostępna i łatwo konfigurowalna biblioteka komponentów.
- **Styling**: **Tailwind CSS**.
  - Główny silnik stylowania.
  - Zapewnia spójność z PrimeNG i szybkość developmentu.
- **Package Manager**: **Bun**.
- **Generowanie PDF**: **jsPDF**.

### 3. Główne Funkcjonalności (Etapy MVP)

**Etap 1: Inicjalizacja i Konfiguracja Obszaru Roboczego**

- **Cel**: Umożliwienie użytkownikowi zdefiniowania wymiarów szuflady przed rozpoczęciem projektowania.
- **Kryteria sukcesu**:
  - Ekran startowy z formularzem: szerokość i głębokość szuflady (w mm).
  - Wygenerowanie sceny 3D z obrysem/podłogą o zadanych wymiarach.
  - Kamera ustawiona tak, aby obejmować cały obszar roboczy.

**Etap 2: Logika Siatki i Zarządzanie Pudełkami**

- **Cel**: Implementacja logiki dodawania pudełek zgodnie z ograniczeniami technologicznymi.
- **Kryteria sukcesu**:
  - Serwis oparty na **Angular Signals** przechowuje listę pudełek.
  - **Automatyczna numeracja**: Każde nowo dodane pudełko otrzymuje kolejny, widoczny dla użytkownika numer (1, 2, 3...).
  - Każde pudełko ma wymiary będące wielokrotnością 16mm.
  - **Walidacja**: Maksymalny rozmiar pojedynczego pudełka to 16x32 jednostki (256mm x 512mm).
  - Pudełka są "przyciągane" (snap) do siatki 16mm.

**Etap 3: Interakcja i Manipulacja (Drag & Drop)**

- **Cel**: Intuicyjne układanie pudełek wewnątrz zdefiniowanej szuflady.
- **Kryteria sukcesu**:
  - **Biblioteka Modułów**: Panel boczny z listą predefiniowanych rozmiarów (np. "Sztućce", "Drobiazgi"), które można przeciągnąć na scenę.
  - **Magnetyczne przyciąganie (Smart Snapping)**: Pudełka "kleją się" do krawędzi innych pudełek, ułatwiając układanie bez szpar.
  - **Wizualizacja numerów**: Każde pudełko wyświetla swój numer porządkowy na górnej ściance.
  - Przesuwanie pudełek metodą przeciągnij-i-upuść z ograniczeniem do obszaru szuflady.
  - Opcjonalnie: Przełącznik widoku 2D (z góry) / 3D dla łatwiejszego pozycjonowania.

**Etap 4: Zmiana Rozmiaru i Detekcja Kolizji**

- **Cel**: Dostosowanie pudełek i zapobieganie błędom w układzie.
- **Kryteria sukcesu**:
  - Zmiana wymiarów pudełka (szerokość/długość/wysokość) za pomocą uchwytów (gizmo) lub panelu bocznego.
  - Wykrywanie kolizji: Pudełka nachodzące na siebie są podświetlane na czerwono.
  - Walidacja w czasie rzeczywistym: Nie można powiększyć pudełka poza obrys szuflady ani poza max wymiar (32 jednostki).

**Etap 5: System Wyceny**

- **Cel**: Natychmiastowa informacja o koszcie konfiguracji.
- **Kryteria sukcesu**:
  - Implementacja algorytmu wyceny (np. na podstawie objętości, zużycia materiału lub liczby modułów).
  - Wyświetlanie aktualnej ceny całkowitej w widocznym miejscu interfejsu.

**Etap 6: Eksport i Finalizacja (PDF + Kod)**

- **Cel**: Umożliwienie klientowi złożenia zamówienia.
- **Kryteria sukcesu**:
  - Przycisk "Podsumowanie / Zamów".
  - Generowanie **Kodu Konfiguracji**: Unikalny ciąg znaków reprezentujący stan projektu (dla łatwego kopiowania).
  - Generowanie **PDF**: Dokument zawierający rzut układu (obraz) z naniesionymi numerami pudełek, listę elementów (zgodną z numeracją), cenę oraz kod konfiguracji.

### 4. Ograniczenia i Założenia Techniczne

- **Brak Backendu**: Cała logika (w tym generowanie PDF i wycena) działa po stronie przeglądarki klienta.
- **Brak trwałego zapisu**: Odświeżenie strony resetuje projekt (chyba że wdrożymy LocalStorage w przyszłości, ale w MVP nie jest to wymagane).
- **Jednolity materiał**: Zakładamy jeden typ materiału/koloru dla wyceny w MVP.

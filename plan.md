## Wstępny Plan Aplikacji: Konfigurator Układu Szuflad 3D

### 1. Cel Aplikacji

Stworzenie interaktywnej aplikacji webowej (Single Page Application), która pozwoli użytkownikom na zaprojektowanie układu pudełek (wkładów) do szuflad na bazie siatki modułowej 16mm. Użytkownik definiuje wymiary swojej szuflady, układa pudełka, a następnie otrzymuje wycenę oraz generuje kod konfiguracji i plik PDF, który służy do złożenia zamówienia w sklepie zewnętrznym.

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
